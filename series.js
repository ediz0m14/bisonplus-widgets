(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────
     CLAVE DE API — solo lectura, datos públicos
  ───────────────────────────────────────────────────────────── */
  var TMDB_KEY = '0606cd80dcd2a4e953505725aa5ea13d';

  /* ─────────────────────────────────────────────────────────────
     ESTADO INTERNO
  ───────────────────────────────────────────────────────────── */
  var toastTimer    = null;
  var tmdbSeasons   = [];
  var activeSeason  = 1;
  var tmdbShowId    = 0;
  var episodesCache = {};
  var sortDesc      = false;
  var lwsTrailerKey   = '';
  var lwsTrailerTitle = '';

  /* ─────────────────────────────────────────────────────────────
     UTILIDADES
  ───────────────────────────────────────────────────────────── */

  /* Extrae ID de TMDB /tv/ — acepta número o URL completa
     Ej: 86031  /  https://www.themoviedb.org/tv/86031 */
  function extractTmdbId(input) {
    if (!input) return null;
    var s = String(input).trim();
    if (/^\d+$/.test(s)) return parseInt(s);
    var m = s.match(/\/(tv|movie)\/(\d+)/);
    return m ? parseInt(m[2]) : null;
  }

  /* Extrae ID de MAL — acepta número o URL completa
     Ej: 38691  /  https://myanimelist.net/anime/38691 */
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

  /* Construye la URL de un episodio usando LW_DATE y LW_SLUG
     Resultado: https://blog.com/2026/02/dr-stone-1x3.html */
  function buildEpUrl(season, epNum) {
    var base = (LW_BLOG_URL || window.location.origin).replace(/\/+$/, '');
    var date = (LW_DATE || '').replace(/\/+$/, '');
    if (date) return base + '/' + date + '/' + LW_SLUG + '-' + season + 'x' + epNum + '.html';
    return base + '/' + LW_SLUG + '-' + season + 'x' + epNum + '.html';
  }

  /* ─────────────────────────────────────────────────────────────
     FETCH — TMDB y Jikan tienen CORS abierto
  ───────────────────────────────────────────────────────────── */
  function apiFetch(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  /* ─────────────────────────────────────────────────────────────
     INIT — carga MAL y TMDB en paralelo
  ───────────────────────────────────────────────────────────── */
  function init() {
    var malId  = extractMalId(LW_MAL_ID)   || 0;
    var tmdbId = extractTmdbId(LW_TMDB_ID) || 0;

    if (!malId && !tmdbId) {
      showError('Define LW_MAL_ID y/o LW_TMDB_ID en la Sección 1.');
      hideLoading();
      return;
    }

    tmdbShowId = tmdbId;

    /* Petición a Jikan/MAL (con un reintento si hay rate-limit) */
    var jikanP = malId
      ? Promise.all([
          apiFetch('https://api.jikan.moe/v4/anime/' + malId),
          apiFetch('https://api.jikan.moe/v4/anime/' + malId + '/videos'),
        ]).catch(function () {
          /* Jikan tiene rate-limit de 3 req/s — reintentamos tras 1.2s */
          return new Promise(function (res) {
            setTimeout(function () {
              Promise.all([
                apiFetch('https://api.jikan.moe/v4/anime/' + malId),
                apiFetch('https://api.jikan.moe/v4/anime/' + malId + '/videos'),
              ]).then(res).catch(function () { res([null, null]); });
            }, 1200);
          });
        })
      : Promise.resolve([null, null]);

    /* Petición a TMDB */
    var tmdbP = tmdbId
      ? Promise.all([
          apiFetch('https://api.themoviedb.org/3/tv/' + tmdbId + '?api_key=' + TMDB_KEY + '&language=es-MX'),
          apiFetch('https://api.themoviedb.org/3/tv/' + tmdbId + '/videos?api_key=' + TMDB_KEY + '&language=es-MX'),
          apiFetch('https://api.themoviedb.org/3/tv/' + tmdbId + '/videos?api_key=' + TMDB_KEY + '&language=en-US'),
          apiFetch('https://api.themoviedb.org/3/tv/' + tmdbId + '/content_ratings?api_key=' + TMDB_KEY),
        ]).catch(function () { return [null, null, null, null]; })
      : Promise.resolve([null, null, null, null]);

    document.getElementById('lws-loading-msg').textContent = 'Importando datos…';

    Promise.all([jikanP, tmdbP]).then(function (results) {
      var jikanArr = results[0];
      var tmdbArr  = results[1];

      var jikan     = (jikanArr[0] && jikanArr[0].data) ? jikanArr[0].data : null;
      var jikanVids = (jikanArr[1] && jikanArr[1].data) ? jikanArr[1].data : null;
      var tmdb      = tmdbArr[0];
      var videosEs  = tmdbArr[1];
      var videosEn  = tmdbArr[2];
      var ratings   = tmdbArr[3];

      var data = buildData(jikan, jikanVids, tmdb, videosEs, videosEn, ratings);
      renderWidget(data);

      /* Cargar temporadas si TMDB tiene datos */
      if (tmdbId && tmdb && tmdb.seasons) {
        tmdbSeasons = tmdb.seasons
          .filter(function (s) { return s.season_number > 0; })
          .map(function (s) { return s.season_number; });

        if (tmdbSeasons.length > 0) {
          buildSeasonTabs(tmdbSeasons);
          /* ✅ Esperar a que los episodios de T1 estén listos
             ANTES de mostrar el widget — así no aparece vacío */
          loadSeasonThen(tmdbSeasons[0], function () {
            hideLoading();
            showWidget();
          });
          return; /* showWidget() lo llama el callback de arriba */
        }
      }

      /* Si no hay temporadas TMDB, mostrar igual */
      hideLoading();
      showWidget();

    }).catch(function (err) {
      console.error('Error cargando datos:', err);
      showError('No se pudo conectar con las APIs. Verifica los IDs en la Sección 1.');
      hideLoading();
    });
  }

  /* ─────────────────────────────────────────────────────────────
     CONSTRUYE DATOS combinando Jikan + TMDB
  ───────────────────────────────────────────────────────────── */
  function buildData(jikan, jikanVids, tmdb, videosEs, videosEn, contentRatings) {
    /* Títulos */
    var titleEs = '', titleRomanized = '', titleOriginal = '';
    if (jikan) {
      titleRomanized = jikan.title          || '';
      titleOriginal  = jikan.title_japanese  || '';
      var titleEn    = jikan.title_english   || '';
      if (jikan.titles) {
        var t = jikan.titles.find(function (t) { return t.type === 'Spanish' || /[áéíóúñ]/i.test(t.title || ''); });
        if (t) titleEs = t.title;
      }
      if (!titleEs) titleEs = (tmdb && tmdb.name) || titleEn || titleRomanized;
    } else if (tmdb) {
      titleEs        = tmdb.name || tmdb.original_name || 'Sin título';
      titleRomanized = tmdb.original_name || '';
    }
    var mainTitle = titleEs || titleRomanized || 'Sin título';

    /* Sinopsis — TMDB en español tiene prioridad */
    var overview = 'Sin sinopsis disponible.';
    if (tmdb && tmdb.overview && tmdb.overview.trim()) overview = tmdb.overview;
    else if (jikan && jikan.synopsis) overview = jikan.synopsis;

    /* Imágenes */
    var poster = '';
    if (jikan && jikan.images && jikan.images.jpg) {
      poster = jikan.images.jpg.large_image_url || jikan.images.jpg.image_url || '';
    }
    if (!poster && tmdb && tmdb.poster_path) poster = 'https://image.tmdb.org/t/p/w500' + tmdb.poster_path;

    var backdrop = (tmdb && tmdb.backdrop_path)
      ? 'https://image.tmdb.org/t/p/original' + tmdb.backdrop_path
      : poster;

    /* Géneros */
    var genreMap = {
      'Action':'Acción','Adventure':'Aventura','Comedy':'Comedia','Drama':'Drama',
      'Fantasy':'Fantasía','Horror':'Terror','Mystery':'Misterio','Romance':'Romance',
      'Sci-Fi':'Ciencia ficción','Science Fiction':'Ciencia ficción',
      'Slice of Life':'Vida cotidiana','Sports':'Deportes','Supernatural':'Sobrenatural',
      'Thriller':'Suspenso','Music':'Música','Psychological':'Psicológico',
      'Mecha':'Mecha','Isekai':'Isekai','Historical':'Histórico',
      'Military':'Militar','School':'Escolar','Magic':'Magia',
      'Martial Arts':'Artes marciales','Kids':'Infantil','Animation':'Animación',
    };
    var genres = [];
    if (jikan) {
      genres = (jikan.genres || []).concat(jikan.themes || []).map(function (g) { return genreMap[g.name] || g.name; });
    } else if (tmdb && tmdb.genres) {
      genres = tmdb.genres.map(function (g) { return genreMap[g.name] || g.name; });
    }

    /* Ratings: TMDB + MAL */
    var ratings = [];
    if (tmdb && tmdb.vote_average > 0) {
      ratings.push({ source:'TMDB', icon:'TMDB', score: tmdb.vote_average.toFixed(1)+' / 10', votes: tmdb.vote_count ? fmtVotes(tmdb.vote_count) : '', pct:(tmdb.vote_average/10)*100, color:'#01d277' });
    }
    if (jikan && jikan.score > 0) {
      ratings.push({ source:'MyAnimeList', icon:'MAL', score: jikan.score.toFixed(2)+' / 10', votes: jikan.scored_by ? fmtVotes(jikan.scored_by) : '', pct:(jikan.score/10)*100, color:'#2e51a2' });
    }

    /* Tráiler */
    var trailer = null;
    if (LW_TRAILER_YT) {
      trailer = { key: LW_TRAILER_YT, name: 'Tráiler oficial' };
    } else {
      var vids = [].concat((videosEs && videosEs.results) || [], (videosEn && videosEn.results) || []);
      if (jikanVids && jikanVids.promo && jikanVids.promo.length && jikanVids.promo[0].trailer && jikanVids.promo[0].trailer.youtube_id) {
        vids.unshift({ key: jikanVids.promo[0].trailer.youtube_id, type:'Trailer', site:'YouTube', name: jikanVids.promo[0].title || 'Tráiler oficial' });
      }
      trailer = vids.find(function (v) { return v.type === 'Trailer' && v.site === 'YouTube'; })
             || vids.find(function (v) { return v.type === 'Teaser'  && v.site === 'YouTube'; })
             || (vids.length ? vids[0] : null);
    }

    /* Año y fecha de estreno */
    var year = '', release = 'N/D';
    var dateStr = (tmdb && tmdb.first_air_date) || (jikan && jikan.aired && jikan.aired.from);
    if (dateStr) {
      year = dateStr.slice(0, 4);
      try { release = new Date(dateStr).toLocaleDateString('es-MX', { day:'numeric', month:'long', year:'numeric' }); }
      catch(e) { release = dateStr; }
    }

    /* Estado de emisión */
    var statusMap = {
      'Finished Airing':'Finalizado','Currently Airing':'En emisión','Not yet aired':'Próximamente',
      'Ended':'Finalizado','Returning Series':'En emisión','In Production':'En producción',
      'Planned':'Planeado','Canceled':'Cancelado',
    };
    var status = '';
    if (tmdb && tmdb.status)  status = statusMap[tmdb.status]  || tmdb.status;
    if (!status && jikan && jikan.status) status = statusMap[jikan.status] || jikan.status;

    /* Studio */
    var studios = jikan
      ? (jikan.studios || []).map(function (s) { return s.name; }).join(', ')
      : (tmdb && tmdb.networks ? tmdb.networks.slice(0,2).map(function (n) { return n.name; }).join(', ') : '');
    if (!studios) studios = 'N/D';

    /* Duración del episodio */
    var runtime = 'N/D';
    if (jikan && jikan.duration) runtime = jikan.duration.replace(/ per ep\.?/i,'').trim();
    else if (tmdb && tmdb.episode_run_time && tmdb.episode_run_time.length) runtime = tmdb.episode_run_time[0] + ' min';

    /* Clasificación */
    var ageRating = '';
    if (contentRatings && contentRatings.results) {
      var cr = contentRatings.results.find(function (r) { return r.iso_3166_1 === 'MX'; })
            || contentRatings.results.find(function (r) { return r.iso_3166_1 === 'US'; });
      if (cr && cr.rating) ageRating = cr.rating;
    }
    if (!ageRating && jikan && jikan.rating) ageRating = jikan.rating;

    /* Totales */
    var totalEps     = (tmdb && tmdb.number_of_episodes) || (jikan && jikan.episodes) || null;
    var totalSeasons = (tmdb && tmdb.seasons)
      ? tmdb.seasons.filter(function (s) { return s.season_number > 0; }).length
      : null;

    return {
      title: mainTitle,
      romanizedTitle: (titleRomanized && titleRomanized !== mainTitle) ? titleRomanized : '',
      originalTitle:  titleOriginal,
      year: year, overview: overview,
      genres: genres, poster: poster, backdrop: backdrop,
      runtime: runtime, ageRating: ageRating,
      studio: studios, ratings: ratings, trailer: trailer,
      releaseDate: release, status: status,
      totalEps: totalEps, totalSeasons: totalSeasons,
      malId: (jikan && jikan.mal_id) ? jikan.mal_id : 0,
    };
  }

  /* ─────────────────────────────────────────────────────────────
     RENDER PRINCIPAL
  ───────────────────────────────────────────────────────────── */
  function renderWidget(d) {
    var blogBase = (LW_BLOG_URL || window.location.origin).replace(/\/+$/, '');

    /* Hero backdrop */
    if (d.backdrop || d.poster) {
      document.getElementById('lws-hero-bg').style.backgroundImage = "url('" + (d.backdrop || d.poster) + "')";
    }

    /* Título hero */
    var heroMain = d.romanizedTitle || d.title;
    document.getElementById('lws-title').innerHTML =
      esc(heroMain) + (d.year ? ' <span style="color:#666;font-weight:300;font-size:.55em;">(' + d.year + ')</span>' : '');

    /* Título original debajo del hero */
    var extHtml = '';
    if (d.originalTitle && d.originalTitle !== heroMain) {
      extHtml = '<p style="color:#888;font-size:.82rem;margin:0;">' +
        '<span style="color:#555;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-right:6px;">Original</span>' +
        esc(d.originalTitle) + '</p>';
    }
    document.getElementById('lws-titles-extra').innerHTML = extHtml;

    /* Meta row: ratings + estado + clasificación + duración */
    var meta = [];
    var sep  = '<span style="width:1px;height:14px;background:#2a2a2a;display:inline-block;"></span>';
    var tmdbR = d.ratings.find(function (r) { return r.source === 'TMDB'; });
    var malR  = d.ratings.find(function (r) { return r.source === 'MyAnimeList'; });

    if (tmdbR) meta.push('<span style="color:#01d277;font-weight:700;font-size:.9rem;">★ ' + tmdbR.score.split(' ')[0] + '</span>');
    if (malR)  meta.push(sep + '<span class="lws-badge-mal">MAL</span><span style="font-weight:700;font-size:.88rem;">' + malR.score.split(' ')[0] + (malR.votes ? ' <span style="color:#666;font-size:.78rem;">(' + malR.votes + ')</span>' : '') + '</span>');
    if (d.ageRating) meta.push(sep + '<span class="lws-badge-age">' + esc(d.ageRating) + '</span>');
    if (d.runtime !== 'N/D') meta.push(sep + '<span style="color:#8a8a8a;font-size:.85rem;">⏱ ' + esc(d.runtime) + '</span>');
    if (d.status) {
      var stColor = d.status === 'En emisión'
        ? 'background:rgba(0,180,255,.15);color:#00b4ff;border:1px solid rgba(0,180,255,.3)'
        : d.status === 'Finalizado'
        ? 'background:rgba(255,255,255,.06);color:#888;border:1px solid #2a2a2a'
        : 'background:rgba(255,102,0,.15);color:#ff9944;border:1px solid rgba(255,102,0,.3)';
      meta.push(sep + '<span style="font-size:.75rem;padding:2px 8px;border-radius:4px;font-weight:700;' + stColor + '">' + esc(d.status) + '</span>');
    }
    document.getElementById('lws-meta-row').innerHTML = meta.join('');

    /* Géneros hero con enlace a etiqueta */
    document.getElementById('lws-genres-row').innerHTML = d.genres.map(function (g) {
      return '<a href="' + blogBase + '/search/label/' + encodeURIComponent(g) + '" class="lws-genre-pill" rel="tag">' + esc(g) + '</a>';
    }).join('');

    /* Panel derecho: poster */
    if (d.poster) document.getElementById('lws-poster').src = d.poster;

    /* Panel derecho: títulos (ROM / ES / ORI) */
    var panelMain = d.romanizedTitle || d.title;
    document.getElementById('lws-panel-title').textContent = panelMain;
    var panelSub = '';
    panelSub += '<div style="font-size:.7rem;color:#666;margin-bottom:3px;"><span style="color:#444;font-weight:700;text-transform:uppercase;font-size:.6rem;letter-spacing:.1em;margin-right:4px;">ROM</span>' + esc(panelMain) + '</div>';
    if (d.title && d.title !== panelMain)         panelSub += '<div style="font-size:.7rem;color:#666;margin-bottom:3px;"><span style="color:#444;font-weight:700;text-transform:uppercase;font-size:.6rem;letter-spacing:.1em;margin-right:4px;">ES</span>' + esc(d.title) + '</div>';
    if (d.originalTitle && d.originalTitle !== panelMain && d.originalTitle !== d.title) panelSub += '<div style="font-size:.7rem;color:#555;"><span style="color:#444;font-weight:700;text-transform:uppercase;font-size:.6rem;letter-spacing:.1em;margin-right:4px;">ORI</span>' + esc(d.originalTitle) + '</div>';
    document.getElementById('lws-panel-original').innerHTML = panelSub;

    /* Panel derecho: géneros (chips pequeños) */
    document.getElementById('lws-panel-genres').innerHTML = d.genres.slice(0,4).map(function (g) {
      return '<a href="' + blogBase + '/search/label/' + encodeURIComponent(g) + '" class="lws-genre-chip-link" rel="tag">' + esc(g) + '</a>';
    }).join('');

    /* Estudio */
    document.getElementById('lws-director').textContent = d.studio;

    /* Ratings con barras */
    renderRatings(d.ratings);

    /* Ficha técnica */
    renderFicha(d);

    /* Sinopsis */
    var synEl = document.getElementById('lws-synopsis');
    synEl.textContent = d.overview;
    if (d.overview.length > 220) document.getElementById('lws-syn-btn').style.display = 'inline';

    /* Tráiler — miniatura en panel derecho */
    if (d.trailer && d.trailer.key) {
      lwsTrailerKey   = d.trailer.key;
      lwsTrailerTitle = d.title;
      var thumb = 'https://img.youtube.com/vi/' + d.trailer.key + '/hqdefault.jpg';
      document.getElementById('lws-trailer-section').style.display = 'block';
      document.getElementById('lws-trailer-img').src = thumb;
      document.getElementById('lws-trailer-label').textContent = d.trailer.name || 'Tráiler oficial';
      document.getElementById('lws-modal-label').textContent   = d.title + ' — ' + (d.trailer.name || 'Tráiler');
    }

    /* Anima las barras de rating con un pequeño delay */
    setTimeout(function () {
      document.querySelectorAll('.lws-rbar-fill[data-pct]').forEach(function (b) {
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
    var el = document.getElementById('lws-ratings');
    if (!ratings.length) {
      el.innerHTML = '<p style="color:#555;font-size:.8rem;">Sin calificaciones disponibles.</p>';
      return;
    }
    el.innerHTML = ratings.map(function (r) {
      var badge = r.icon === 'MAL'
        ? '<span class="lws-badge-mal">MAL</span>'
        : r.icon === 'TMDB'
        ? '<span class="lws-badge-tmdb">TMDB</span>'
        : '<span style="font-size:1rem;">' + (r.icon || '?') + '</span>';
      return '<div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;">' +
          '<div style="display:flex;align-items:center;gap:8px;">' + badge +
            '<span style="font-weight:700;color:#fff;font-size:.88rem;">' + esc(r.score) +
              (r.votes ? ' <span style="color:#666;font-size:.75rem;">(' + esc(r.votes) + ')</span>' : '') +
            '</span>' +
          '</div>' +
          '<span style="color:#555;font-size:.75rem;">' + esc(r.source) + '</span>' +
        '</div>' +
        '<div class="lws-rbar-bg"><div class="lws-rbar-fill" data-pct="' + r.pct + '" style="background:' + r.color + ';"></div></div>' +
      '</div>';
    }).join('');
  }

  /* ─────────────────────────────────────────────────────────────
     RENDER FICHA TÉCNICA
  ───────────────────────────────────────────────────────────── */
  function renderFicha(d) {
    var rows = [
      ['Año',          d.year          || 'N/D'],
      ['Estreno',      d.releaseDate],
      ['Duración ep.', d.runtime],
      ['Estudio',      d.studio],
    ];
    if (d.ageRating)    rows.push(['Clasificación', d.ageRating]);
    if (d.totalSeasons) rows.push(['Temporadas',    String(d.totalSeasons)]);
    if (d.totalEps)     rows.push(['Episodios',     String(d.totalEps)]);
    if (d.status)       rows.push(['Estado',        d.status]);
    if (d.malId)        rows.push(['MAL',  '<a href="https://myanimelist.net/anime/' + d.malId + '" target="_blank" rel="noopener" style="color:#2e51a2;">Ver en MAL ↗</a>']);
    if (tmdbShowId)     rows.push(['TMDB', '<a href="https://www.themoviedb.org/tv/' + tmdbShowId + '" target="_blank" rel="noopener" style="color:#01d277;">Ver en TMDB ↗</a>']);

    document.getElementById('lws-ficha').innerHTML = rows.map(function (r) {
      return '<div style="display:flex;justify-content:space-between;gap:8px;">' +
        '<span style="color:#666;">' + r[0] + '</span>' +
        '<span style="color:#e0e0e0;font-weight:500;text-align:right;">' + r[1] + '</span>' +
      '</div>';
    }).join('');
  }

  /* ─────────────────────────────────────────────────────────────
     TEMPORADAS — tabs + carga bajo demanda con caché
  ───────────────────────────────────────────────────────────── */
  function buildSeasonTabs(seasons) {
    document.getElementById('lws-season-tabs').innerHTML = seasons.map(function (sn, i) {
      return '<button class="lws-season-btn ' + (i === 0 ? 'active' : '') + '" onclick="lwsSelectSeason(this,' + sn + ')">T' + sn + '</button>';
    }).join('');
  }

  window.lwsSelectSeason = function (el, seasonNum) {
    activeSeason = seasonNum;
    document.querySelectorAll('.lws-season-btn').forEach(function (b) { b.classList.remove('active'); });
    el.classList.add('active');
    /* Limpiar buscador al cambiar de temporada */
    document.getElementById('lws-ep-search').value = '';
    document.getElementById('lws-ep-empty').style.display = 'none';
    loadSeason(seasonNum);
  };

  function loadSeason(seasonNum) {
    loadSeasonThen(seasonNum, null);
  }

  /* Igual que loadSeason pero ejecuta onReady() cuando los episodios
     ya están renderizados — usado para mostrar el widget en el momento correcto */
  function loadSeasonThen(seasonNum, onReady) {
    activeSeason = seasonNum;
    var epList = document.getElementById('lws-ep-list');

    /* Skeleton mientras carga */
    epList.innerHTML = [1,2,3,4,5].map(function () {
      return '<div style="display:flex;gap:12px;padding:10px;border-radius:10px;border:1px solid #1e1e1e;background:#111;">' +
        '<div class="lws-skel" style="width:112px;min-width:112px;aspect-ratio:16/9;border-radius:6px;"></div>' +
        '<div style="flex:1;display:flex;flex-direction:column;gap:8px;padding:4px 0;">' +
          '<div class="lws-skel" style="height:14px;width:60%;"></div>' +
          '<div class="lws-skel" style="height:10px;width:30%;"></div>' +
          '<div class="lws-skel" style="height:10px;width:90%;"></div>' +
          '<div class="lws-skel" style="height:10px;width:75%;"></div>' +
        '</div></div>';
    }).join('');

    /* Usar caché si ya se cargó esta temporada */
    if (episodesCache[seasonNum]) {
      renderEpisodes(episodesCache[seasonNum], seasonNum);
      if (onReady) onReady();
      return;
    }

    apiFetch('https://api.themoviedb.org/3/tv/' + tmdbShowId + '/season/' + seasonNum + '?api_key=' + TMDB_KEY + '&language=es-MX')
      .then(function (season) {
        episodesCache[seasonNum] = season.episodes || [];
        renderEpisodes(episodesCache[seasonNum], seasonNum);
        if (onReady) onReady();
      })
      .catch(function () {
        epList.innerHTML = '<p style="color:#555;font-size:.85rem;text-align:center;padding:20px 0;">No se pudieron cargar los episodios.</p>';
        if (onReady) onReady(); /* mostrar el widget aunque falle */
      });
  }

  /* ─────────────────────────────────────────────────────────────
     RENDER EPISODIOS — con filtro, orden y desbloqueo por fecha
  ───────────────────────────────────────────────────────────── */
  function renderEpisodes(episodes, seasonNum, filterText) {
    var epList = document.getElementById('lws-ep-list');
    var sn     = seasonNum || activeSeason;
    var today  = new Date();

    if (!episodes.length) {
      epList.innerHTML = '<p style="color:#555;font-size:.85rem;text-align:center;padding:20px 0;">Sin episodios disponibles para esta temporada.</p>';
      return;
    }

    /* Aplicar orden */
    var list = episodes.slice();
    if (sortDesc) list = list.reverse();

    /* Aplicar filtro de búsqueda */
    var query = (filterText || '').trim().toLowerCase();
    if (query) {
      list = list.filter(function (ep) {
        return (ep.name || '').toLowerCase().indexOf(query) >= 0
            || String(ep.episode_number).indexOf(query) >= 0;
      });
    }

    /* Mostrar / ocultar mensaje de sin resultados */
    var emptyEl = document.getElementById('lws-ep-empty');
    if (!list.length) {
      epList.innerHTML = '';
      document.getElementById('lws-ep-empty-q').textContent = query;
      emptyEl.style.display = 'block';
      return;
    }
    emptyEl.style.display = 'none';

    epList.innerHTML = list.map(function (ep) {
      var epNum      = ep.episode_number;
      var title      = ep.name || ('Episodio ' + epNum);
      var overview   = ep.overview || '';
      var airDate    = ep.air_date ? new Date(ep.air_date) : null;
      var isUnlocked = airDate ? (airDate <= today) : false;
      var thumb      = ep.still_path ? 'https://image.tmdb.org/t/p/w300' + ep.still_path : '';
      var labelSxE   = sn + 'x' + epNum;
      var epUrl      = buildEpUrl(sn, epNum);

      /* Fecha formateada */
      var dateLabel = '';
      if (airDate) {
        try { dateLabel = airDate.toLocaleDateString('es-MX', { day:'numeric', month:'long', year:'numeric' }); }
        catch(e) { dateLabel = ep.air_date; }
      }

      /* Miniatura */
      var thumbHtml = '<div class="lws-ep-thumb">';
      if (thumb) thumbHtml += '<img src="' + thumb + '" alt="' + esc(title) + '" loading="lazy">';
      else       thumbHtml += '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#333;font-size:1.4rem;">▶</div>';
      thumbHtml += '<span class="lws-ep-num">' + esc(labelSxE) + '</span>';
      if (!isUnlocked) thumbHtml += '<div class="lws-ep-lock">🔒</div>';
      thumbHtml += '</div>';

      /* Info del episodio */
      var infoHtml = '<div class="lws-ep-info">' +
        '<div class="lws-ep-title">' + esc(title) + '</div>' +
        (dateLabel ? '<div class="lws-ep-date">📅 ' + dateLabel + '</div>' : '') +
        (overview && isUnlocked ? '<div class="lws-ep-overview">' + esc(overview) + '</div>' : '') +
        (!isUnlocked ? '<div class="lws-ep-date" style="color:#333;font-size:.72rem;">🔒 Próximamente</div>' : '') +
      '</div>';

      if (isUnlocked) {
        return '<a href="' + epUrl + '" class="lws-ep-card">' + thumbHtml + infoHtml + '</a>';
      } else {
        return '<div class="lws-ep-card locked">' + thumbHtml + infoHtml + '</div>';
      }
    }).join('');
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
    var keywords = parts.concat(d.genres || []).concat(['ver online','anime','serie','latino','subtitulado', d.year]).filter(Boolean).join(', ');

    try { document.title = seoTitle; } catch(e) {}

    function setName(n, v) {
      var el = document.querySelector('meta[name="'+n+'"]');
      if (!el) { el = document.createElement('meta'); el.setAttribute('name', n); document.head.appendChild(el); }
      el.setAttribute('content', v);
    }
    function setProp(p, v) {
      var el = document.querySelector('meta[property="'+p+'"]');
      if (!el) { el = document.createElement('meta'); el.setAttribute('property', p); document.head.appendChild(el); }
      el.setAttribute('content', v);
    }

    setName('description',         seoDesc);
    setName('keywords',            keywords);
    setName('robots',              'index, follow');
    setProp('og:title',            seoTitle);
    setProp('og:description',      seoDesc);
    setProp('og:image',            seoImg);
    setProp('og:url',              seoUrl);
    setProp('og:type',             'video.tv_show');
    setProp('og:locale',           'es_MX');
    setName('twitter:card',        'summary_large_image');
    setName('twitter:title',       seoTitle);
    setName('twitter:description', seoDesc);
    setName('twitter:image',       seoImg);

    var canon = document.querySelector('link[rel="canonical"]');
    if (!canon) { canon = document.createElement('link'); canon.setAttribute('rel','canonical'); document.head.appendChild(canon); }
    canon.setAttribute('href', seoUrl);

    /* JSON-LD Schema.org TVSeries */
    var bestR = (d.ratings || []).find(function (r) { return r.source === 'MyAnimeList'; })
             || (d.ratings || []).find(function (r) { return r.source === 'TMDB'; });
    var jsonLd = {
      '@context': 'https://schema.org',
      '@type':    'TVSeries',
      'name':      d.title,
      'alternateName': [d.romanizedTitle, d.originalTitle].filter(Boolean),
      'description': d.overview || '',
      'image':     seoImg,
      'startDate': d.year || '',
      'genre':     d.genres || [],
      'url':       seoUrl,
      'inLanguage': 'es',
      'aggregateRating': bestR ? {
        '@type': 'AggregateRating',
        'ratingValue': bestR.score.split(' ')[0],
        'bestRating': '10',
        'ratingCount': bestR.votes ? bestR.votes.replace(/\D/g,'') : undefined
      } : undefined
    };

    var ld = document.getElementById('lws-jsonld') || (function () {
      var s = document.createElement('script');
      s.type = 'application/ld+json';
      s.id   = 'lws-jsonld';
      document.head.appendChild(s);
      return s;
    })();
    ld.textContent = JSON.stringify(jsonLd, function (k, v) { return v === undefined ? undefined : v; }, 2);
  }

  /* ─────────────────────────────────────────────────────────────
     INTERACTIVIDAD — funciones globales
  ───────────────────────────────────────────────────────────── */

  /* Expande la sinopsis */
  window.lwsExpandSyn = function () {
    var el = document.getElementById('lws-synopsis');
    el.style['-webkit-line-clamp'] = 'unset';
    el.style.display = 'block';
    document.getElementById('lws-syn-btn').style.display = 'none';
  };

  /* Buscador de episodios */
  window.lwsFilterEpisodes = function () {
    var query = document.getElementById('lws-ep-search').value;
    renderEpisodes(episodesCache[activeSeason] || [], activeSeason, query);
  };

  /* Orden ASC / DESC */
  window.lwsToggleSort = function (btn) {
    sortDesc = !sortDesc;
    btn.classList.toggle('desc', sortDesc);
    document.getElementById('lws-sort-label').textContent = sortDesc ? 'N-1' : '1-N';
    var query = document.getElementById('lws-ep-search').value;
    renderEpisodes(episodesCache[activeSeason] || [], activeSeason, query);
  };

  /* Modal del tráiler */
  window.lwsOpenTrailer = function (id) {
    if (!id) return;
    document.getElementById('lws-modal-iframe').src = 'https://www.youtube.com/embed/' + id + '?autoplay=1';
    document.getElementById('lws-modal').classList.add('lws-active');
    document.body.style.overflow = 'hidden';
  };
  window.lwsCloseTrailer = function () {
    document.getElementById('lws-modal').classList.remove('lws-active');
    document.getElementById('lws-modal-iframe').src = '';
    document.body.style.overflow = '';
  };
  window.lwsCloseTrailerOutside = function (e) {
    if (e.target === document.getElementById('lws-modal')) window.lwsCloseTrailer();
  };

  /* Compartir */
  window.lwsShare = function (net) {
    var url   = encodeURIComponent(window.location.href);
    var title = encodeURIComponent(document.title);
    var links = {
      twitter:  'https://twitter.com/intent/tweet?text=' + title + '&url=' + url,
      facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + url,
    };
    if (links[net]) window.open(links[net], '_blank', 'width=600,height=400');
    lwsToast('OK', 'Compartiendo en ' + net + '…');
  };
  window.lwsCopyLink = function () {
    try { navigator.clipboard.writeText(window.location.href); } catch(e) {}
    lwsToast('OK', 'Enlace copiado');
  };

  /* ─────────────────────────────────────────────────────────────
     HELPERS INTERNOS
  ───────────────────────────────────────────────────────────── */
  function hideLoading() {
    var el = document.getElementById('lws-loading');
    if (el) el.style.display = 'none';
  }

  function showWidget() {
    document.getElementById('lws-widget').style.display = 'block';
    /* Detiene el spinner de carga del navegador */
    try { window.stop(); } catch(e) {}
  }

  function showError(msg) {
    hideLoading();
    var wrap = document.getElementById('lws-widget');
    wrap.style.display = 'block';
    wrap.innerHTML = '<div class="lws-error">⚠️ ' + msg + '</div>';
  }

  function lwsToast(icon, msg) {
    clearTimeout(toastTimer);
    document.getElementById('lws-toast-icon').textContent = icon;
    document.getElementById('lws-toast-msg').textContent  = msg;
    document.getElementById('lws-toast').classList.add('lws-show');
    toastTimer = setTimeout(function () {
      document.getElementById('lws-toast').classList.remove('lws-show');
    }, 2800);
  }

  /* Tecla Escape cierra el modal */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') window.lwsCloseTrailer();
  });

  /* Arranca cuando el DOM está listo */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
