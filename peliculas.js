(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────
     CLAVES DE API
     Estas claves son de solo lectura (solo buscan datos públicos)
  ───────────────────────────────────────────────────────────── */
  var TMDB_KEY = '0606cd80dcd2a4e953505725aa5ea13d';
  var OMDB_KEY = '635bf77e';

  /* ─────────────────────────────────────────────────────────────
     ESTADO INTERNO
  ───────────────────────────────────────────────────────────── */
  var activeServer  = 0;
  var activeLangKey = '';
  var trailerYtId   = '';
  var toastTimer    = null;

  /* ─────────────────────────────────────────────────────────────
     UTILIDADES
  ───────────────────────────────────────────────────────────── */

  /* Extrae ID numérico de TMDB — acepta número o URL completa
     Ej: 128  /  https://www.themoviedb.org/movie/128  /  themoviedb.org/movie/128 */
  function extractTmdbId(input) {
    if (!input) return null;
    var s = String(input).trim();
    if (/^\d+$/.test(s)) return parseInt(s);
    var m = s.match(/\/(movie|tv)\/(\d+)/);
    return m ? parseInt(m[2]) : null;
  }

  /* Extrae ID numérico de MAL — acepta número o URL completa
     Ej: 40456  /  https://myanimelist.net/anime/40456  /  myanimelist.net/anime/40456 */
  function extractMalId(input) {
    if (!input) return null;
    var s = String(input).trim();
    if (/^\d+$/.test(s)) return parseInt(s);
    var m = s.match(/\/anime\/(\d+)/);
    return m ? parseInt(m[1]) : null;
  }

  /* Escapa HTML para evitar XSS */
  function esc(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* Formatea votos: 1234567 → "1.2M" */
  function fmtVotes(n) {
    n = parseInt(String(n).replace(/,/g,''));
    if (isNaN(n) || n === 0) return '';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000)    return Math.round(n / 1000) + 'k';
    return String(n);
  }

  /* ─────────────────────────────────────────────────────────────
     FETCH — usa fetch() normal (TMDB y Jikan tienen CORS abierto)
  ───────────────────────────────────────────────────────────── */
  function apiFetch(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  /* ─────────────────────────────────────────────────────────────
     INIT — detecta si es anime (MAL) o película (TMDB)
  ───────────────────────────────────────────────────────────── */
  function init() {
    var malId  = extractMalId(LW_MAL_ID)   || 0;
    var tmdbId = extractTmdbId(LW_MOVIE)   || 0;

    if (!malId && !tmdbId) {
      showError('Define LW_MAL_ID (anime) o LW_MOVIE (película) en la Sección 1.');
      hideLoading();
      return;
    }

    /* Inicializa el idioma activo con el primero habilitado */
    var first = LW_LANGS.find(function (l) { return l.enabled; });
    activeLangKey = first ? first.key : '';

    if (malId) {
      loadFromJikan(malId, tmdbId);
    } else {
      loadFromTMDB(tmdbId);
    }
  }

  /* ─────────────────────────────────────────────────────────────
     CARGA DESDE JIKAN / MAL  (para anime)
  ───────────────────────────────────────────────────────────── */
  function loadFromJikan(malId, tmdbId) {
    var base = 'https://api.jikan.moe/v4/anime/' + malId;

    Promise.all([
      apiFetch(base),
      apiFetch(base + '/videos'),
    ]).then(function (res) {
      var jikan     = res[0].data || {};
      var jikanVids = res[1].data || {};

      /* TMDB opcional: solo para obtener el backdrop de la película */
      var tmdbP = tmdbId
        ? apiFetch('https://api.themoviedb.org/3/movie/' + tmdbId + '?api_key=' + TMDB_KEY + '&language=es-MX').catch(function () { return null; })
        : Promise.resolve(null);

      tmdbP.then(function (tmdb) {
        var data = buildDataFromJikan(jikan, jikanVids, tmdb);
        renderWidget(data);
        hideLoading();
        showWidget();
      });

    }).catch(function (err) {
      console.error('Jikan error:', err);
      /* Jikan tiene rate-limit → reintentamos una vez después de 1.2s */
      if (!loadFromJikan._retried) {
        loadFromJikan._retried = true;
        setTimeout(function () { loadFromJikan(malId, tmdbId); }, 1200);
      } else {
        showError('No se pudo conectar con MyAnimeList. Verifica LW_MAL_ID: ' + malId);
        hideLoading();
      }
    });
  }

  /* ─────────────────────────────────────────────────────────────
     CARGA DESDE TMDB  (para películas)
  ───────────────────────────────────────────────────────────── */
  function loadFromTMDB(id) {
    var base = 'https://api.themoviedb.org/3/movie/' + id;
    var key  = '?api_key=' + TMDB_KEY + '&language=es-MX';

    Promise.all([
      apiFetch(base + key),
      apiFetch(base + '/credits' + key),
      apiFetch(base + '/videos' + key),
      apiFetch(base + '/videos?api_key=' + TMDB_KEY + '&language=en-US'),
      apiFetch(base + '/release_dates?api_key=' + TMDB_KEY),
    ]).then(function (r) {
      var tmdb = r[0], credits = r[1], videosEs = r[2], videosEn = r[3], releaseDates = r[4];

      /* OMDB para ratings extra (IMDb, Rotten Tomatoes, Metacritic) */
      var omdbP = tmdb.imdb_id
        ? apiFetch('https://www.omdbapi.com/?i=' + tmdb.imdb_id + '&apikey=' + OMDB_KEY + '&tomatoes=true').catch(function () { return null; })
        : Promise.resolve(null);

      omdbP.then(function (omdb) {
        var data = buildDataFromTMDB(tmdb, credits, videosEs, videosEn, releaseDates, omdb);
        renderWidget(data);
        hideLoading();
        showWidget();
      });

    }).catch(function (err) {
      console.error('TMDB error:', err);
      showError('No se pudo conectar con TMDB. Verifica LW_MOVIE: ' + id);
      hideLoading();
    });
  }

  /* ─────────────────────────────────────────────────────────────
     RATINGS DESDE OMDB  (IMDb, Rotten Tomatoes, Metacritic)
  ───────────────────────────────────────────────────────────── */
  function buildRatingsFromOMDB(omdb) {
    var ratings = [];
    if (!omdb) return ratings;

    if (omdb.imdbRating && omdb.imdbRating !== 'N/A') {
      ratings.push({
        source: 'IMDb', type: 'imdb',
        score:  omdb.imdbRating + ' / 10',
        votes:  omdb.imdbVotes || '',
        pct:    (parseFloat(omdb.imdbRating) / 10) * 100,
        color:  '#f5c518'
      });
    }
    if (omdb.Ratings) {
      var rt = omdb.Ratings.find(function (r) { return r.Source === 'Rotten Tomatoes'; });
      if (rt) {
        var p = parseInt(rt.Value);
        ratings.push({ source: 'Rotten Tomatoes', icon: 'RT', score: rt.Value, votes: '', pct: p, color: p >= 60 ? '#fa4032' : '#aaa', rtFresh: p >= 60 });
      }
      var mc = omdb.Ratings.find(function (r) { return r.Source === 'Metacritic'; });
      if (mc) {
        var pm = parseInt(mc.Value);
        ratings.push({ source: 'Metacritic', icon: 'MC', score: mc.Value + ' / 100', votes: '', pct: pm, color: pm >= 61 ? '#6ab04c' : pm >= 40 ? '#f9ca24' : '#eb4d4b' });
      }
    }
    return ratings;
  }

  /* ─────────────────────────────────────────────────────────────
     CONSTRUYE DATOS DESDE JIKAN / MAL
  ───────────────────────────────────────────────────────────── */
  function buildDataFromJikan(jikan, jikanVids, tmdbExtra) {
    /* Títulos: Jikan devuelve romanizado, japonés e inglés por separado */
    var titleRomanized = jikan.title          || '';
    var titleOriginal  = jikan.title_japanese  || '';
    var titleEs        = '';

    if (jikan.titles && jikan.titles.length) {
      var t = jikan.titles.find(function (t) { return t.type === 'Spanish' || /[áéíóúñ]/i.test(t.title || ''); });
      if (t) titleEs = t.title;
    }
    var mainTitle = titleEs || jikan.title_english || titleRomanized;

    /* Tráiler */
    var trailer = null;
    if (LW_TRAILER_YT) {
      trailer = { key: LW_TRAILER_YT, name: 'Tráiler oficial' };
    } else if (jikanVids.promo && jikanVids.promo.length && jikanVids.promo[0].trailer && jikanVids.promo[0].trailer.youtube_id) {
      trailer = { key: jikanVids.promo[0].trailer.youtube_id, name: jikanVids.promo[0].title || 'Tráiler oficial' };
    }

    /* Imágenes */
    var jpg     = (jikan.images && jikan.images.jpg) || {};
    var poster  = jpg.large_image_url || jpg.image_url || '';
    var backdrop = (tmdbExtra && tmdbExtra.backdrop_path)
      ? 'https://image.tmdb.org/t/p/original' + tmdbExtra.backdrop_path
      : poster;

    /* Géneros: Jikan da en inglés, los traducimos */
    var genreMap = {
      'Action':'Acción','Adventure':'Aventura','Comedy':'Comedia','Drama':'Drama',
      'Fantasy':'Fantasía','Horror':'Terror','Mystery':'Misterio','Romance':'Romance',
      'Sci-Fi':'Ciencia ficción','Slice of Life':'Vida cotidiana','Sports':'Deportes',
      'Supernatural':'Sobrenatural','Thriller':'Suspenso','Music':'Música',
      'Psychological':'Psicológico','Mecha':'Mecha','Isekai':'Isekai',
      'Historical':'Histórico','Military':'Militar','School':'Escolar',
      'Magic':'Magia','Martial Arts':'Artes marciales','Kids':'Infantil',
    };
    var genres = (jikan.genres || []).concat(jikan.themes || []).map(function (g) {
      return genreMap[g.name] || g.name;
    });

    /* Ratings */
    var ratings = [];
    if (tmdbExtra && tmdbExtra.vote_average > 0) {
      ratings.push({ source:'TMDB', icon:'TMDB', score: tmdbExtra.vote_average.toFixed(1)+' / 10', votes: tmdbExtra.vote_count ? fmtVotes(tmdbExtra.vote_count) : '', pct:(tmdbExtra.vote_average/10)*100, color:'#01d277' });
    }
    if (jikan.score > 0) {
      ratings.push({ source:'MyAnimeList', icon:'MAL', score: jikan.score.toFixed(2)+' / 10', votes: jikan.scored_by ? fmtVotes(jikan.scored_by) : '', pct:(jikan.score/10)*100, color:'#2e51a2' });
    }

    /* Fecha y año */
    var aired    = jikan.aired || {};
    var year     = jikan.year ? String(jikan.year) : (aired.from ? aired.from.slice(0,4) : '');
    var release  = 'N/D';
    if (aired.from) {
      try { release = new Date(aired.from).toLocaleDateString('es-MX', { day:'numeric', month:'long', year:'numeric' }); }
      catch(e) { release = aired.from; }
    }

    var studios   = (jikan.studios || []).map(function (s) { return s.name; }).join(', ') || 'N/D';
    var runtime   = (jikan.duration || 'N/D').replace(/ per ep\.?/i,'').trim();

    return {
      title: mainTitle, romanizedTitle: titleRomanized !== mainTitle ? titleRomanized : '',
      originalTitle: titleOriginal, year: year, overview: jikan.synopsis || 'Sin sinopsis.',
      genres: genres, poster: poster, backdrop: backdrop,
      runtime: runtime, ageRating: jikan.rating || '', country: 'Japón', language: 'JA',
      studio: studios, director: studios,
      ratings: ratings, trailer: trailer,
      imdbId: '', releaseDate: release,
      budget: 0, revenue: 0, malId: jikan.mal_id || 0,
      episodes: jikan.episodes || null, status: jikan.status || '',
    };
  }

  /* ─────────────────────────────────────────────────────────────
     CONSTRUYE DATOS DESDE TMDB
  ───────────────────────────────────────────────────────────── */
  function buildDataFromTMDB(tmdb, credits, videosEs, videosEn, releaseDates, omdb) {
    /* Director */
    var director = 'N/D';
    if (credits && credits.crew) {
      var d = credits.crew.find(function (p) { return p.job === 'Director'; });
      if (d) director = d.name;
    }

    /* Tráiler */
    var trailer = null;
    if (LW_TRAILER_YT) {
      trailer = { key: LW_TRAILER_YT, name: 'Tráiler oficial' };
    } else {
      var vids = [].concat((videosEs && videosEs.results) || [], (videosEn && videosEn.results) || []);
      trailer = vids.find(function (v) { return v.type === 'Trailer' && v.site === 'YouTube'; })
             || vids.find(function (v) { return v.type === 'Teaser'  && v.site === 'YouTube'; })
             || (vids.length ? vids[0] : null);
    }

    /* Clasificación de edad */
    var ageRating = '';
    if (releaseDates && releaseDates.results) {
      var rel = releaseDates.results.find(function (r) { return r.iso_3166_1 === 'MX'; })
             || releaseDates.results.find(function (r) { return r.iso_3166_1 === 'US'; });
      if (rel && rel.release_dates && rel.release_dates[0]) ageRating = rel.release_dates[0].certification || '';
    }

    /* Ratings */
    var ratings = [];
    if (tmdb.vote_average > 0) {
      ratings.push({ source:'TMDB', icon:'TMDB', score: tmdb.vote_average.toFixed(1)+' / 10', votes: tmdb.vote_count ? fmtVotes(tmdb.vote_count) : '', pct:(tmdb.vote_average/10)*100, color:'#01d277' });
    }
    ratings = ratings.concat(buildRatingsFromOMDB(omdb));

    /* Runtime */
    var rt = tmdb.runtime || 0;
    var runtime = rt ? Math.floor(rt/60) + 'h ' + (rt%60) + 'min' : 'N/D';

    /* Fecha */
    var release = 'N/D';
    if (tmdb.release_date) {
      try { release = new Date(tmdb.release_date).toLocaleDateString('es-MX', { day:'numeric', month:'long', year:'numeric' }); }
      catch(e) { release = tmdb.release_date; }
    }

    return {
      title: tmdb.title || tmdb.name || 'Sin título',
      romanizedTitle: '',
      originalTitle:  tmdb.original_title || tmdb.original_name || '',
      year:           tmdb.release_date ? tmdb.release_date.slice(0,4) : '',
      overview:       tmdb.overview || 'Sin sinopsis.',
      genres:         (tmdb.genres || []).map(function (g) { return g.name; }),
      poster:         tmdb.poster_path   ? 'https://image.tmdb.org/t/p/w500'     + tmdb.poster_path   : '',
      backdrop:       tmdb.backdrop_path ? 'https://image.tmdb.org/t/p/original' + tmdb.backdrop_path : '',
      runtime: runtime, ageRating: ageRating,
      country:  (tmdb.production_countries || []).map(function (c) { return c.name; }).join(', ') || 'N/D',
      language: tmdb.original_language ? tmdb.original_language.toUpperCase() : 'N/D',
      studio:   (tmdb.production_companies || []).slice(0,2).map(function (c) { return c.name; }).join(', ') || 'N/D',
      director: director,
      ratings:  ratings, trailer: trailer,
      imdbId:   tmdb.imdb_id || '', releaseDate: release,
      budget:   tmdb.budget  || 0, revenue: tmdb.revenue || 0,
      malId: 0, episodes: null, status: '',
    };
  }

  /* ─────────────────────────────────────────────────────────────
     RENDER PRINCIPAL
  ───────────────────────────────────────────────────────────── */
  function renderWidget(d) {
    var blogBase = (LW_BLOG_URL || window.location.origin).replace(/\/+$/, '');

    /* Hero backdrop */
    if (d.backdrop || d.poster) {
      document.getElementById('lw-hero-bg').style.backgroundImage = "url('" + (d.backdrop || d.poster) + "')";
    }

    /* Poster en el reproductor */
    if (d.poster) {
      document.getElementById('lw-player-poster').style.backgroundImage = "url('" + d.poster + "')";
    }

    /* Título hero */
    var heroMain = d.romanizedTitle || d.title;
    document.getElementById('lw-title').innerHTML =
      esc(heroMain) + (d.year ? ' <span style="color:#666;font-weight:300;font-size:.55em;">(' + d.year + ')</span>' : '');

    /* Título original debajo del hero */
    var extHtml = '';
    if (d.originalTitle && d.originalTitle !== heroMain) {
      extHtml = '<p style="color:#888;font-size:.82rem;margin:0;">' +
        '<span style="color:#555;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-right:6px;">Original</span>' +
        esc(d.originalTitle) + '</p>';
    }
    document.getElementById('lw-titles-extra').innerHTML = extHtml;

    /* Meta row: ratings + clasificación + duración */
    var meta = [];
    var tmdbR = d.ratings.find(function (r) { return r.source === 'TMDB'; });
    var malR  = d.ratings.find(function (r) { return r.source === 'MyAnimeList'; });
    var imdbR = d.ratings.find(function (r) { return r.source === 'IMDb'; });
    var rtR   = d.ratings.find(function (r) { return r.source === 'Rotten Tomatoes'; });
    var sep   = '<span style="width:1px;height:14px;background:#2a2a2a;display:inline-block;"></span>';

    if (tmdbR) meta.push('<span style="color:#01d277;font-weight:700;font-size:.9rem;">★ ' + tmdbR.score.split(' ')[0] + '</span>');
    if (malR)  meta.push(sep + '<span style="background:#2e51a2;color:#fff;font-weight:800;font-size:.72rem;padding:2px 6px;border-radius:4px;">MAL</span><span style="font-weight:700;font-size:.88rem;">' + malR.score.split(' ')[0] + (malR.votes ? ' <span style="color:#666;font-size:.78rem;">(' + malR.votes + ')</span>' : '') + '</span>');
    if (imdbR) meta.push(sep + '<span class="lw-badge-imdb">IMDb</span><span style="font-weight:700;font-size:.88rem;">' + imdbR.score.split(' ')[0] + (imdbR.votes ? ' <span style="color:#666;font-size:.78rem;">(' + imdbR.votes + ')</span>' : '') + '</span>');
    if (rtR)   meta.push(sep + '<span style="font-size:.9rem;">' + (rtR.rtFresh ? '🍅' : '🍅') + '</span><span style="font-weight:700;font-size:.88rem;color:' + rtR.color + ';">' + rtR.score + '</span>');
    if (d.ageRating) meta.push(sep + '<span class="lw-badge-age">' + esc(d.ageRating) + '</span>');
    if (d.runtime !== 'N/D') meta.push(sep + '<span style="color:#8a8a8a;font-size:.85rem;">⏱ ' + esc(d.runtime) + '</span>');
    document.getElementById('lw-meta-row').innerHTML = meta.join('');

    /* Géneros hero con enlace a etiqueta */
    document.getElementById('lw-genres-row').innerHTML = d.genres.map(function (g) {
      return '<a href="' + blogBase + '/search/label/' + encodeURIComponent(g) + '" class="lw-genre-pill" rel="tag">' + esc(g) + '</a>';
    }).join('');

    /* Panel derecho: poster */
    if (d.poster) document.getElementById('lw-poster').src = d.poster;

    /* Panel derecho: títulos (ROM / ES / ORI) */
    var panelMain = d.romanizedTitle || d.title;
    document.getElementById('lw-panel-title').textContent = panelMain;
    var panelSub = '';
    panelSub += '<div style="font-size:.7rem;color:#666;margin-bottom:3px;"><span style="color:#444;font-weight:700;text-transform:uppercase;font-size:.6rem;letter-spacing:.1em;margin-right:4px;">ROM</span>' + esc(panelMain) + '</div>';
    if (d.title && d.title !== panelMain)         panelSub += '<div style="font-size:.7rem;color:#666;margin-bottom:3px;"><span style="color:#444;font-weight:700;text-transform:uppercase;font-size:.6rem;letter-spacing:.1em;margin-right:4px;">ES</span>' + esc(d.title) + '</div>';
    if (d.originalTitle && d.originalTitle !== panelMain && d.originalTitle !== d.title) panelSub += '<div style="font-size:.7rem;color:#555;"><span style="color:#444;font-weight:700;text-transform:uppercase;font-size:.6rem;letter-spacing:.1em;margin-right:4px;">ORI</span>' + esc(d.originalTitle) + '</div>';
    document.getElementById('lw-panel-original').innerHTML = panelSub;

    /* Panel derecho: géneros (chips pequeños) */
    document.getElementById('lw-panel-genres').innerHTML = d.genres.slice(0,4).map(function (g) {
      return '<a href="' + blogBase + '/search/label/' + encodeURIComponent(g) + '" class="lw-genre-chip-link" rel="tag">' + esc(g) + '</a>';
    }).join('');

    /* Director */
    document.getElementById('lw-director').textContent = d.director;

    /* Ratings con barras */
    renderRatings(d.ratings);

    /* Ficha técnica */
    renderFicha(d);

    /* Sinopsis */
    var synEl = document.getElementById('lw-synopsis');
    synEl.textContent = d.overview;
    if (d.overview.length > 220) document.getElementById('lw-syn-btn').style.display = 'inline';

    /* Tráiler: columna izquierda + miniatura panel derecho */
    if (d.trailer && d.trailer.key) {
      trailerYtId = d.trailer.key;
      var thumb = 'https://img.youtube.com/vi/' + trailerYtId + '/hqdefault.jpg';
      var name  = d.trailer.name || 'Tráiler oficial';

      /* Izquierda */
      document.getElementById('lw-trailer-section').style.display = 'block';
      document.getElementById('lw-trailer-img').src = thumb;
      document.getElementById('lw-trailer-label').textContent = name;
      document.getElementById('lw-trailer-thumb').onclick = function () { lwOpenTrailer(trailerYtId, d.title); };

      /* Panel derecho */
      document.getElementById('lw-trailer-panel-section').style.display = 'block';
      document.getElementById('lw-trailer-panel-img').src = thumb;
      document.getElementById('lw-trailer-panel-label').textContent = name;
      document.getElementById('lw-modal-label').textContent = d.title + ' — ' + name;
    }

    /* Servidores */
    renderServers();

    /* Anima las barras de rating con un pequeño delay */
    setTimeout(function () {
      document.querySelectorAll('.lw-rbar-fill[data-pct]').forEach(function (b) {
        b.style.width = Math.min(parseFloat(b.getAttribute('data-pct')), 100) + '%';
      });
    }, 350);

    /* SEO */
    injectSEO(d);
  }

  /* ─────────────────────────────────────────────────────────────
     RENDER RATINGS
  ───────────────────────────────────────────────────────────── */
  function renderRatings(ratings) {
    var el = document.getElementById('lw-ratings');
    if (!ratings.length) {
      el.innerHTML = '<p style="color:#555;font-size:.8rem;">Sin calificaciones disponibles.</p>';
      return;
    }
    el.innerHTML = ratings.map(function (r) {
      var badge = '';
      if (r.type === 'imdb')   badge = '<span class="lw-badge-imdb">IMDb</span>';
      else if (r.icon === 'MC')   badge = '<span style="background:' + r.color + ';color:#fff;font-weight:800;font-size:.7rem;padding:2px 6px;border-radius:4px;">MC</span>';
      else if (r.icon === 'MAL')  badge = '<span style="background:#2e51a2;color:#fff;font-weight:800;font-size:.7rem;padding:2px 6px;border-radius:4px;">MAL</span>';
      else if (r.icon === 'TMDB') badge = '<span style="background:#01d277;color:#000;font-weight:800;font-size:.7rem;padding:2px 6px;border-radius:4px;">TMDB</span>';
      else if (r.icon === 'RT')   badge = '<span style="font-size:.88rem;">' + (r.rtFresh ? 'RT+' : 'RT') + '</span>';
      else badge = '<span style="font-size:1rem;">' + (r.icon || '?') + '</span>';

      return '<div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;">' +
          '<div style="display:flex;align-items:center;gap:8px;">' + badge +
            '<span style="font-weight:700;color:#fff;font-size:.88rem;">' + esc(r.score) +
              (r.votes ? ' <span style="color:#666;font-size:.75rem;">(' + esc(r.votes) + ')</span>' : '') +
            '</span>' +
          '</div>' +
          '<span style="color:#555;font-size:.75rem;">' + esc(r.source) + '</span>' +
        '</div>' +
        '<div class="lw-rbar-bg"><div class="lw-rbar-fill" data-pct="' + r.pct + '" style="background:' + r.color + ';"></div></div>' +
      '</div>';
    }).join('');
  }

  /* ─────────────────────────────────────────────────────────────
     RENDER FICHA TÉCNICA
  ───────────────────────────────────────────────────────────── */
  function renderFicha(d) {
    var rows = [
      ['Año',       d.year        || 'N/D'],
      ['Duración',  d.runtime],
      ['País',      d.country],
      ['Idioma',    d.language],
      ['Estudio',   d.studio],
      ['Estreno',   d.releaseDate],
    ];
    if (d.ageRating)  rows.push(['Clasificación', d.ageRating]);
    if (d.episodes)   rows.push(['Episodios',     String(d.episodes)]);
    if (d.status)     rows.push(['Estado',        d.status]);
    if (d.budget > 0) rows.push(['Presupuesto',   '$' + (d.budget  / 1e6).toFixed(0) + 'M USD']);
    if (d.revenue> 0) rows.push(['Recaudación',   '$' + (d.revenue / 1e6).toFixed(0) + 'M USD']);
    if (d.malId)  rows.push(['MAL', '<a href="https://myanimelist.net/anime/' + d.malId + '" target="_blank" rel="noopener" style="color:#2e51a2;">Ver en MAL</a>']);
    if (d.imdbId) rows.push(['IMDb', '<a href="https://www.imdb.com/title/' + d.imdbId + '" target="_blank" rel="noopener" style="color:#f5c518;">' + d.imdbId + '</a>']);

    document.getElementById('lw-ficha').innerHTML = rows.map(function (r) {
      return '<div style="display:flex;justify-content:space-between;gap:8px;">' +
        '<span style="color:#666;">' + r[0] + '</span>' +
        '<span style="color:#e0e0e0;font-weight:500;text-align:right;">' + r[1] + '</span>' +
      '</div>';
    }).join('');
  }

  /* ─────────────────────────────────────────────────────────────
     RENDER SERVIDORES Y SELECTOR DE IDIOMA
  ───────────────────────────────────────────────────────────── */
  function buildLangSelector() {
    var sel = document.getElementById('lw-lang-select');
    sel.innerHTML = '';
    LW_LANGS.forEach(function (l) {
      if (!l.enabled) return;
      var opt = document.createElement('option');
      opt.value = l.key;
      opt.textContent = l.flag + ' ' + l.label;
      if (l.key === activeLangKey) opt.selected = true;
      sel.appendChild(opt);
    });
    var cur = LW_LANGS.find(function (l) { return l.key === activeLangKey; });
    if (cur) document.getElementById('lw-lang-flag').textContent = cur.flag;
  }

  function getActiveLangServers() {
    var lang = LW_LANGS.find(function (l) { return l.key === activeLangKey; });
    return (lang && lang.servers) ? lang.servers : [];
  }

  function renderServers() {
    buildLangSelector();
    var servers = getActiveLangServers();
    var cont = document.getElementById('lw-server-tabs');
    if (!servers.length) {
      cont.innerHTML = '<span style="color:#555;font-size:.8rem;">Sin servidores para este idioma.</span>';
      return;
    }
    cont.innerHTML = servers.map(function (s, i) {
      return '<button class="lw-server-tab ' + (i === 0 ? 'active' : '') + '" onclick="lwSwitchServer(this,' + i + ')">' + esc(s.name) + '</button>';
    }).join('');
    activeServer = 0;
  }

  /* ─────────────────────────────────────────────────────────────
     INTERACTIVIDAD — funciones globales (llamadas desde el HTML)
  ───────────────────────────────────────────────────────────── */

  /* Cambia servidor activo */
  window.lwSwitchServer = function (el, idx) {
    activeServer = idx;
    document.querySelectorAll('.lw-server-tab').forEach(function (t) { t.classList.remove('active'); });
    el.classList.add('active');
    resetPlayer();
    document.getElementById('lw-play-label').textContent = 'Reproducir: ' + el.textContent;
    lwToast('OK', 'Servidor: ' + el.textContent);
  };

  /* Inicia el reproductor al hacer clic en el botón play */
  window.lwStartPlayer = function () {
    var servers = getActiveLangServers();
    var server  = servers[activeServer] || { name: '?', url: '' };
    var pw      = document.getElementById('lw-player-wrap');
    var overlay = document.getElementById('lw-play-overlay');
    var poster  = document.getElementById('lw-player-poster');

    /* Quita el player anterior si existía */
    var existing = document.getElementById('lw-active-player');
    if (existing) existing.remove();

    var div = document.createElement('div');
    div.id = 'lw-active-player';
    div.style.cssText = 'position:absolute;inset:0;z-index:20;';

    if (server.url && server.url.trim() !== '') {
      /* ✅ Tiene URL: carga el iframe */
      var iframe = document.createElement('iframe');
      iframe.src = server.url;
      iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
      iframe.allowFullscreen = true;
      div.appendChild(iframe);

      /* Oculta el overlay y el poster DESPUÉS de agregar el iframe */
      pw.appendChild(div);
      overlay.style.display = 'none';
      poster.style.display  = 'none';

    } else {
      /* ⚠️ Sin URL: muestra mensaje, NO crea iframe (evita el spinner infinito) */
      div.style.cssText += 'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:#0d0d0d;';
      var langLabel = (LW_LANGS.find(function (l) { return l.key === activeLangKey; }) || {}).label || activeLangKey;
      div.innerHTML =
        '<svg style="width:42px;height:42px;color:#f5c518;" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>' +
        '<p style="color:#666;font-size:.82rem;font-family:Outfit,sans-serif;text-align:center;padding:0 20px;">' +
          'Servidor: <strong style="color:#e0e0e0;">' + esc(server.name) + '</strong> — ' +
          'Idioma: <strong style="color:#00b4ff;">' + esc(langLabel) + '</strong><br>' +
          '<span style="color:#444;font-size:.72rem;">Agrega la URL del embed en LW_LANGS para activar este servidor</span>' +
        '</p>';

      pw.appendChild(div);
      overlay.style.display = 'none';
      poster.style.display  = 'none';
    }
  };

  /* Cambia idioma */
  window.lwChangeLang = function (sel) {
    activeLangKey = sel.value;
    var lang = LW_LANGS.find(function (l) { return l.key === activeLangKey; });
    document.getElementById('lw-lang-flag').textContent = lang ? lang.flag : '🌐';
    resetPlayer();
    var servers = getActiveLangServers();
    var cont    = document.getElementById('lw-server-tabs');
    if (!servers.length) {
      cont.innerHTML = '<span style="color:#555;font-size:.8rem;">Sin servidores para este idioma.</span>';
    } else {
      cont.innerHTML = servers.map(function (s, i) {
        return '<button class="lw-server-tab ' + (i===0?'active':'') + '" onclick="lwSwitchServer(this,' + i + ')">' + esc(s.name) + '</button>';
      }).join('');
    }
    activeServer = 0;
    document.getElementById('lw-play-label').textContent = 'Reproducir';
    lwToast('OK', (lang ? lang.flag + ' ' : '') + (lang ? lang.label : sel.value));
  };

  /* Abre / cierra el modal del tráiler */
  window.lwOpenTrailer = function (id) {
    if (!id) return;
    document.getElementById('lw-modal-iframe').src = 'https://www.youtube.com/embed/' + id + '?autoplay=1';
    document.getElementById('lw-modal').classList.add('lw-active');
    document.body.style.overflow = 'hidden';
  };
  window.lwCloseTrailer = function () {
    document.getElementById('lw-modal').classList.remove('lw-active');
    document.getElementById('lw-modal-iframe').src = '';
    document.body.style.overflow = '';
  };
  window.lwCloseTrailerOutside = function (e) {
    if (e.target === document.getElementById('lw-modal')) window.lwCloseTrailer();
  };

  /* Expande la sinopsis */
  window.lwExpandSyn = function () {
    var el = document.getElementById('lw-synopsis');
    el.style['-webkit-line-clamp'] = 'unset';
    el.style.display = 'block';
    document.getElementById('lw-syn-btn').style.display = 'none';
  };

  /* Compartir */
  window.lwShare    = function (net) { lwToast('OK', 'Compartiendo en ' + net + '…'); };
  window.lwCopyLink = function () {
    try { navigator.clipboard.writeText(window.location.href); } catch(e) {}
    lwToast('OK', 'Enlace copiado');
  };

  /* ─────────────────────────────────────────────────────────────
     HELPERS INTERNOS
  ───────────────────────────────────────────────────────────── */

  /* Resetea el reproductor: quita el iframe y muestra el overlay de play */
  function resetPlayer() {
    var existing = document.getElementById('lw-active-player');
    if (existing) existing.remove();
    document.getElementById('lw-play-overlay').style.display = 'flex';
    document.getElementById('lw-player-poster').style.display = 'block';
  }

  function hideLoading() {
    var el = document.getElementById('lw-loading');
    if (el) el.style.display = 'none';
  }

  function showWidget() {
    document.getElementById('lw-widget').style.display = 'block';
    /* Fuerza al navegador a dejar de mostrar el spinner de carga
       que queda girando cuando hay iframes o recursos pendientes */
    try { window.stop(); } catch(e) {}
  }

  function showError(msg) {
    hideLoading();
    var wrap = document.getElementById('lw-widget');
    wrap.style.display = 'block';
    wrap.innerHTML = '<div class="lw-error">⚠️ ' + msg + '</div>';
  }

  function lwToast(icon, msg) {
    clearTimeout(toastTimer);
    document.getElementById('lw-toast-icon').textContent = icon;
    document.getElementById('lw-toast-msg').textContent  = msg;
    document.getElementById('lw-toast').classList.add('lw-show');
    toastTimer = setTimeout(function () {
      document.getElementById('lw-toast').classList.remove('lw-show');
    }, 2800);
  }

  /* ─────────────────────────────────────────────────────────────
     SEO — meta tags, Open Graph, Twitter Card, JSON-LD
  ───────────────────────────────────────────────────────────── */
  function injectSEO(d) {
    var parts    = [d.title];
    if (d.romanizedTitle && d.romanizedTitle !== d.title) parts.push(d.romanizedTitle);
    if (d.originalTitle  && d.originalTitle  !== d.title) parts.push(d.originalTitle);
    var seoTitle = parts.join(' / ') + (d.year ? ' (' + d.year + ')' : '') + ' - Ver Online Latino';
    var seoDesc  = (d.overview || '').slice(0, 160);
    var seoImg   = d.poster || d.backdrop || '';
    var seoUrl   = window.location.href;
    var keywords = parts.concat(d.genres || []).concat(['ver online','latino','subtitulado', d.year]).filter(Boolean).join(', ');

    try { document.title = seoTitle; } catch(e) {}

    function setMeta(sel, attr, val) {
      var el = document.querySelector(sel) || document.head.appendChild(document.createElement('meta'));
      el.setAttribute(attr, val);
    }
    function setName(n, v) {
      var el = document.querySelector('meta[name="'+n+'"]');
      if (!el) { el = document.createElement('meta'); el.setAttribute('name',n); document.head.appendChild(el); }
      el.setAttribute('content', v);
    }
    function setProp(p, v) {
      var el = document.querySelector('meta[property="'+p+'"]');
      if (!el) { el = document.createElement('meta'); el.setAttribute('property',p); document.head.appendChild(el); }
      el.setAttribute('content', v);
    }

    setName('description', seoDesc);
    setName('keywords',    keywords);
    setName('robots',      'index, follow');
    setProp('og:title',       seoTitle);
    setProp('og:description', seoDesc);
    setProp('og:image',       seoImg);
    setProp('og:url',         seoUrl);
    setProp('og:type',        'video.movie');
    setProp('og:locale',      'es_MX');
    setName('twitter:card',        'summary_large_image');
    setName('twitter:title',       seoTitle);
    setName('twitter:description', seoDesc);
    setName('twitter:image',       seoImg);

    var canon = document.querySelector('link[rel="canonical"]');
    if (!canon) { canon = document.createElement('link'); canon.setAttribute('rel','canonical'); document.head.appendChild(canon); }
    canon.setAttribute('href', seoUrl);

    /* JSON-LD Schema.org Movie */
    var imdbR = (d.ratings || []).find(function (r) { return r.source === 'IMDb'; });
    var tmdbR = (d.ratings || []).find(function (r) { return r.source === 'TMDB'; });
    var aggR  = imdbR || tmdbR;
    var jsonLd = {
      '@context': 'https://schema.org',
      '@type':    'Movie',
      'name':      d.title,
      'alternateName': [d.romanizedTitle, d.originalTitle].filter(Boolean),
      'description': d.overview || '',
      'image':     seoImg,
      'datePublished': d.year || '',
      'director':  d.director !== 'N/D' ? { '@type':'Person', 'name': d.director } : undefined,
      'genre':     d.genres || [],
      'url':       seoUrl,
      'inLanguage': 'es',
      'aggregateRating': aggR ? {
        '@type': 'AggregateRating',
        'ratingValue': aggR.score.split(' ')[0],
        'bestRating': '10',
        'ratingCount': (aggR.votes || '').replace(/\D/g,'') || undefined
      } : undefined
    };

    var ld = document.getElementById('lw-jsonld') || (function () {
      var s = document.createElement('script');
      s.type = 'application/ld+json';
      s.id   = 'lw-jsonld';
      document.head.appendChild(s);
      return s;
    })();
    ld.textContent = JSON.stringify(jsonLd, function (k, v) { return v === undefined ? undefined : v; }, 2);
  }

  /* ─────────────────────────────────────────────────────────────
     TECLA ESCAPE cierra el modal
  ───────────────────────────────────────────────────────────── */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') window.lwCloseTrailer();
  });

  /* ─────────────────────────────────────────────────────────────
     ARRANCA cuando el DOM está listo
  ───────────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
