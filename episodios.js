(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────
     CLAVE DE API — solo lectura, datos públicos
  ───────────────────────────────────────────────────────────── */
  var TMDB_KEY = '0606cd80dcd2a4e953505725aa5ea13d';

  /* ─────────────────────────────────────────────────────────────
     ESTADO INTERNO
  ───────────────────────────────────────────────────────────── */
  var activeServer  = 0;
  var activeLangKey = '';
  var toastTimer    = null;
  var allEpisodes   = [];

  /* ─────────────────────────────────────────────────────────────
     UTILIDADES
  ───────────────────────────────────────────────────────────── */

  /* Extrae ID de TMDB /tv/ — acepta número o URL completa */
  function extractTmdbId(input) {
    if (!input) return null;
    var s = String(input).trim();
    if (/^\d+$/.test(s)) return parseInt(s);
    var m = s.match(/\/(tv|movie)\/(\d+)/);
    return m ? parseInt(m[2]) : null;
  }

  /* Extrae ID de MAL — acepta número o URL completa */
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

  /* Construye la URL de un episodio: /2026/02/dr-stone-1x3.html */
  function buildEpUrl(season, epNum) {
    var base = (LW_BLOG_URL || window.location.origin).replace(/\/+$/, '');
    var date = (LW_DATE || '').replace(/\/+$/, '');
    if (date) return base + '/' + date + '/' + LW_SLUG + '-' + season + 'x' + epNum + '.html';
    return base + '/' + LW_SLUG + '-' + season + 'x' + epNum + '.html';
  }

  /* ─────────────────────────────────────────────────────────────
     FETCH
  ───────────────────────────────────────────────────────────── */
  function apiFetch(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  /* ─────────────────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────────────────── */
  function init() {
    var malId  = extractMalId(LW_MAL_ID)   || 0;
    var tmdbId = extractTmdbId(LW_TMDB_ID) || 0;
    var season = parseInt(LW_SEASON)  || 1;
    var epNum  = parseInt(LW_EPISODE) || 1;

    if (!tmdbId) {
      showError('Define LW_TMDB_ID en la Sección 1.');
      hideLoading();
      return;
    }

    /* Autocompleta LW_SERIE_URL si es ruta relativa */
    var blogBase = (LW_BLOG_URL || window.location.origin).replace(/\/+$/, '');
    if (LW_SERIE_URL && LW_SERIE_URL.charAt(0) === '/') {
      LW_SERIE_URL = blogBase + LW_SERIE_URL;
    }

    /* Idioma activo: el primero habilitado */
    var firstLang = LW_LANGS.find(function (l) { return l.enabled; });
    activeLangKey = firstLang ? firstLang.key : '';

    document.getElementById('lwe-loading-msg').textContent = 'Cargando episodio ' + season + 'x' + epNum + '…';

    /* Jikan con reintento por rate-limit */
    var jikanP = malId
      ? apiFetch('https://api.jikan.moe/v4/anime/' + malId)
          .catch(function () {
            return new Promise(function (res) {
              setTimeout(function () {
                apiFetch('https://api.jikan.moe/v4/anime/' + malId)
                  .then(res).catch(function () { res(null); });
              }, 1200);
            });
          })
      : Promise.resolve(null);

    var tmdbShowP   = apiFetch('https://api.themoviedb.org/3/tv/' + tmdbId + '?api_key=' + TMDB_KEY + '&language=es-MX');
    var tmdbSeasonP = apiFetch('https://api.themoviedb.org/3/tv/' + tmdbId + '/season/' + season + '?api_key=' + TMDB_KEY + '&language=es-MX');

    Promise.all([jikanP, tmdbShowP, tmdbSeasonP])
      .then(function (res) {
        var jikanRaw   = res[0];
        var jikan      = jikanRaw && jikanRaw.data ? jikanRaw.data : jikanRaw;
        var show       = res[1];
        var seasonData = res[2];

        allEpisodes = seasonData.episodes || [];

        /* Episodio actual */
        var ep = allEpisodes.find(function (e) { return e.episode_number === epNum; })
               || allEpisodes[epNum - 1]
               || {};

        var data = buildData(jikan, show, ep, season, epNum, tmdbId);
        renderWidget(data);
        renderMiniEpList(allEpisodes, season, epNum);
        renderNavigation(allEpisodes, season, epNum);
        renderServers();

        hideLoading();
        showWidget();

        /* Scroll automático al episodio actual + animación de barras */
        setTimeout(function () {
          var cur = document.querySelector('.lwe-ep-item.current');
          if (cur) cur.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          document.querySelectorAll('.lwe-rbar-fill[data-pct]').forEach(function (b) {
            b.style.width = Math.min(parseFloat(b.getAttribute('data-pct')), 100) + '%';
          });
        }, 400);
      })
      .catch(function (err) {
        console.error('Error:', err);
        showError('No se pudo conectar con las APIs. Verifica los IDs en la Sección 1.');
        hideLoading();
      });
  }

  /* ─────────────────────────────────────────────────────────────
     CONSTRUYE DATOS del episodio
  ───────────────────────────────────────────────────────────── */
  function buildData(jikan, show, ep, season, epNum, tmdbId) {
    /* Títulos de la serie */
    var titleEs = '', titleRomanized = '', titleOriginal = '';
    if (jikan) {
      titleRomanized = jikan.title          || '';
      titleOriginal  = jikan.title_japanese || '';
      if (jikan.titles) {
        var t = jikan.titles.find(function (t) { return t.type === 'Spanish' || /[áéíóúñ]/i.test(t.title || ''); });
        if (t) titleEs = t.title;
      }
      if (!titleEs) titleEs = jikan.title_english || titleRomanized;
    }
    if (!titleEs && show) titleEs = show.name || show.original_name || 'Sin título';
    if (!titleRomanized && show) titleRomanized = show.original_name || '';
    var serieTitle = titleEs || titleRomanized || 'Sin título';

    /* Poster de la serie (MAL tiene prioridad) */
    var poster = '';
    if (jikan && jikan.images && jikan.images.jpg) {
      poster = jikan.images.jpg.large_image_url || jikan.images.jpg.image_url || '';
    }
    if (!poster && show && show.poster_path) poster = 'https://image.tmdb.org/t/p/w500' + show.poster_path;

    /* Still del episodio o backdrop de la serie como fallback */
    var still = ep.still_path
      ? 'https://image.tmdb.org/t/p/original' + ep.still_path
      : (show && show.backdrop_path ? 'https://image.tmdb.org/t/p/original' + show.backdrop_path : '');

    /* Géneros */
    var genreMap = {
      'Action':'Acción','Adventure':'Aventura','Comedy':'Comedia','Drama':'Drama',
      'Fantasy':'Fantasía','Horror':'Terror','Mystery':'Misterio','Romance':'Romance',
      'Sci-Fi':'Ciencia ficción','Science Fiction':'Ciencia ficción',
      'Slice of Life':'Vida cotidiana','Sports':'Deportes','Supernatural':'Sobrenatural',
      'Thriller':'Suspenso','Music':'Música','Psychological':'Psicológico',
      'Mecha':'Mecha','Isekai':'Isekai','Historical':'Histórico',
      'Military':'Militar','School':'Escolar','Magic':'Magia','Animation':'Animación',
    };
    var genres = jikan
      ? (jikan.genres || []).concat(jikan.themes || []).map(function (g) { return genreMap[g.name] || g.name; })
      : (show && show.genres ? show.genres.map(function (g) { return genreMap[g.name] || g.name; }) : []);

    /* Ratings de la serie */
    var ratings = [];
    if (show && show.vote_average > 0) {
      ratings.push({ source:'TMDB', icon:'TMDB', score: show.vote_average.toFixed(1)+' / 10', votes: show.vote_count ? fmtVotes(show.vote_count) : '', pct:(show.vote_average/10)*100, color:'#01d277' });
    }
    if (jikan && jikan.score > 0) {
      ratings.push({ source:'MyAnimeList', icon:'MAL', score: jikan.score.toFixed(2)+' / 10', votes: jikan.scored_by ? fmtVotes(jikan.scored_by) : '', pct:(jikan.score/10)*100, color:'#2e51a2' });
    }

    /* Fecha del episodio */
    var epDate = 'N/D';
    if (ep.air_date) {
      try { epDate = new Date(ep.air_date).toLocaleDateString('es-MX', { day:'numeric', month:'long', year:'numeric' }); }
      catch(e) { epDate = ep.air_date; }
    }

    /* Duración */
    var runtime = 'N/D';
    if (ep.runtime) runtime = ep.runtime + ' min';
    else if (show && show.episode_run_time && show.episode_run_time.length) runtime = show.episode_run_time[0] + ' min';
    else if (jikan && jikan.duration) runtime = jikan.duration.replace(/ per ep\.?/i,'').trim();

    /* Studio */
    var studio = jikan
      ? (jikan.studios || []).map(function (s) { return s.name; }).join(', ')
      : (show && show.networks ? show.networks.slice(0,2).map(function (n) { return n.name; }).join(', ') : '');
    if (!studio) studio = 'N/D';

    /* Estado */
    var statusMap = { 'Finished Airing':'Finalizado','Currently Airing':'En emisión','Ended':'Finalizado','Returning Series':'En emisión' };
    var status = '';
    if (show && show.status)  status = statusMap[show.status]  || show.status;
    if (!status && jikan && jikan.status) status = statusMap[jikan.status] || jikan.status;

    return {
      serieTitle, titleRomanized, titleOriginal,
      poster, still, stillPath: ep.still_path || '', genres, ratings, studio, status,
      epTitle:    ep.name || ('Episodio ' + epNum),
      epOverview: ep.overview || 'Sin sinopsis disponible para este episodio.',
      epDate, runtime, season, epNum,
      epRating:    ep.vote_average || 0,
      epVoteCount: ep.vote_count   || 0,
      totalEps: (show && show.number_of_episodes) || allEpisodes.length,
      malId:   (jikan && jikan.mal_id) || 0,
      tmdbId:  tmdbId,
    };
  }

  /* ─────────────────────────────────────────────────────────────
     RENDER PRINCIPAL
  ───────────────────────────────────────────────────────────── */
  function renderWidget(d) {
    var blogBase = (LW_BLOG_URL || window.location.origin).replace(/\/+$/, '');

    /* Hero: still del episodio */
    if (d.still) document.getElementById('lwe-hero-bg').style.backgroundImage = "url('" + d.still + "')";

    /* ── Imagen para el feed de Blogger ─────────────────────────
       Blogger usa el primer <img> visible (o el bloque <!-- more -->)
       para mostrar la miniatura en la lista de entradas.
       Inyectamos un div oculto con la imagen del episodio justo
       al inicio del widget para que Blogger la detecte en el feed.
       El still_path de TMDB es el ID que aparece en la URL de la
       imagen: /t/p/original/{still_path}.jpg
    ─────────────────────────────────────────────────────────────── */
    (function () {
      var imgUrl = d.stillPath
        ? 'https://image.tmdb.org/t/p/original' + d.stillPath
        : (d.poster || '');
      if (!imgUrl) return;

      /* Reutiliza el contenedor si ya existe (por si se llama dos veces) */
      var existing = document.getElementById('lwe-feed-poster');
      if (existing) { existing.querySelector('img').src = imgUrl; return; }

      var wrap = document.createElement('div');
      wrap.id = 'lwe-feed-poster';
      /* display:none — visible para el crawler de Blogger, invisible para el usuario */
      wrap.className = 'poster-container';
      wrap.style.display = 'none';
      var img = document.createElement('img');
      img.src = imgUrl;
      img.alt = d.serieTitle + ' ' + d.season + 'x' + d.epNum;
      wrap.appendChild(img);

      /* Insertarlo antes del spinner de carga para que quede al principio del HTML */
      var loading = document.getElementById('lwe-loading');
      if (loading && loading.parentNode) {
        loading.parentNode.insertBefore(wrap, loading);
      }
    })();
    /* Poster en el reproductor */
    if (d.still || d.poster) {
      document.getElementById('lwe-player-poster').style.backgroundImage = "url('" + (d.still || d.poster) + "')";
    }

    /* Botón volver a la serie */
    document.getElementById('lwe-serie-back').href = LW_SERIE_URL || '#';
    document.getElementById('lwe-serie-name').textContent = d.serieTitle;

    /* Título del episodio */
    document.getElementById('lwe-ep-title').textContent = d.epTitle;

    /* Subtítulo: nombre serie + badge SxE */
    var sxe = d.season + 'x' + d.epNum;
    document.getElementById('lwe-ep-subtitle').innerHTML =
      '<span style="color:#8a8a8a;font-size:.85rem;font-weight:500;">' + esc(d.serieTitle) + '</span>' +
      '<span style="width:1px;height:12px;background:#2a2a2a;display:inline-block;"></span>' +
      '<span class="lwe-badge-ep">' + sxe + '</span>';

    /* Meta row: rating del episodio + fecha + duración */
    var meta = [];
    var sep  = '<span style="width:1px;height:14px;background:#2a2a2a;display:inline-block;"></span>';
    if (d.epRating > 0) {
      meta.push('<span style="color:#f5c518;font-weight:700;font-size:.88rem;">★ ' + d.epRating.toFixed(1) +
        (d.epVoteCount ? ' <span style="color:#555;font-weight:400;font-size:.75rem;">(' + fmtVotes(d.epVoteCount) + ')</span>' : '') +
        '</span>');
    }
    if (d.epDate !== 'N/D') meta.push(sep + '<span style="color:#8a8a8a;font-size:.82rem;">📅 ' + esc(d.epDate) + '</span>');
    if (d.runtime !== 'N/D') meta.push(sep + '<span style="color:#8a8a8a;font-size:.82rem;">⏱ ' + esc(d.runtime) + '</span>');
    document.getElementById('lwe-meta-row').innerHTML = meta.join('');

    /* Géneros */
    document.getElementById('lwe-genres-row').innerHTML = d.genres.map(function (g) {
      return '<a href="' + blogBase + '/search/label/' + encodeURIComponent(g) + '" class="lwe-genre-pill" rel="tag">' + esc(g) + '</a>';
    }).join('');

    /* Sinopsis del episodio */
    document.getElementById('lwe-ep-overview').textContent = d.epOverview;

    /* Header de la mini-lista */
    document.getElementById('lwe-ep-list-season').textContent = d.season;
    document.getElementById('lwe-ver-todos').href = LW_SERIE_URL || '#';

    /* Panel derecho: poster */
    if (d.poster) document.getElementById('lwe-poster').src = d.poster;

    /* Panel derecho: títulos (ROM / ES / ORI) */
    var panelMain = d.titleRomanized || d.serieTitle;
    document.getElementById('lwe-panel-title').textContent = panelMain;
    var subHtml = '';
    subHtml += '<div style="font-size:.7rem;color:#666;margin-bottom:3px;"><span style="color:#444;font-weight:700;text-transform:uppercase;font-size:.6rem;letter-spacing:.1em;margin-right:4px;">ROM</span>' + esc(panelMain) + '</div>';
    if (d.serieTitle && d.serieTitle !== panelMain) subHtml += '<div style="font-size:.7rem;color:#666;margin-bottom:3px;"><span style="color:#444;font-weight:700;text-transform:uppercase;font-size:.6rem;letter-spacing:.1em;margin-right:4px;">ES</span>' + esc(d.serieTitle) + '</div>';
    if (d.titleOriginal && d.titleOriginal !== panelMain && d.titleOriginal !== d.serieTitle) subHtml += '<div style="font-size:.7rem;color:#555;"><span style="color:#444;font-weight:700;text-transform:uppercase;font-size:.6rem;letter-spacing:.1em;margin-right:4px;">ORI</span>' + esc(d.titleOriginal) + '</div>';
    document.getElementById('lwe-panel-original').innerHTML = subHtml;

    /* Panel derecho: géneros */
    document.getElementById('lwe-panel-genres').innerHTML = d.genres.slice(0,4).map(function (g) {
      return '<a href="' + blogBase + '/search/label/' + encodeURIComponent(g) + '" class="lwe-genre-chip-link" rel="tag">' + esc(g) + '</a>';
    }).join('');

    /* Ratings */
    renderRatings(d.ratings);

    /* Ficha del episodio */
    var fichaRows = [
      ['Temporada',  'T' + d.season],
      ['Episodio',   d.season + 'x' + d.epNum],
      ['Duración',   d.runtime],
      ['Emisión',    d.epDate],
      ['Estudio',    d.studio],
    ];
    if (d.status)    fichaRows.push(['Estado',    d.status]);
    if (d.totalEps)  fichaRows.push(['Total eps', String(d.totalEps)]);
    if (d.malId)     fichaRows.push(['MAL',  '<a href="https://myanimelist.net/anime/' + d.malId + '" target="_blank" rel="noopener" style="color:#2e51a2;">Ver en MAL ↗</a>']);
    if (d.tmdbId)    fichaRows.push(['TMDB', '<a href="https://www.themoviedb.org/tv/' + d.tmdbId + '/season/' + d.season + '/episode/' + d.epNum + '" target="_blank" rel="noopener" style="color:#01d277;">Ver en TMDB ↗</a>']);
    document.getElementById('lwe-ficha').innerHTML = fichaRows.map(function (r) {
      return '<div style="display:flex;justify-content:space-between;gap:8px;">' +
        '<span style="color:#666;">' + r[0] + '</span>' +
        '<span style="color:#e0e0e0;font-weight:500;text-align:right;">' + r[1] + '</span>' +
      '</div>';
    }).join('');

    /* SEO */
    injectSEO(d);
  }

  /* ─────────────────────────────────────────────────────────────
     RENDER RATINGS
  ───────────────────────────────────────────────────────────── */
  function renderRatings(ratings) {
    var el = document.getElementById('lwe-ratings');
    if (!ratings.length) {
      el.innerHTML = '<p style="color:#555;font-size:.8rem;">Sin calificaciones disponibles.</p>';
      return;
    }
    el.innerHTML = ratings.map(function (r) {
      var badge = r.icon === 'MAL'
        ? '<span class="lwe-badge-mal">MAL</span>'
        : '<span class="lwe-badge-tmdb">TMDB</span>';
      return '<div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;">' +
          '<div style="display:flex;align-items:center;gap:8px;">' + badge +
            '<span style="font-weight:700;color:#fff;font-size:.88rem;">' + esc(r.score) +
              (r.votes ? ' <span style="color:#666;font-size:.75rem;">(' + esc(r.votes) + ')</span>' : '') +
            '</span>' +
          '</div>' +
          '<span style="color:#555;font-size:.75rem;">' + esc(r.source) + '</span>' +
        '</div>' +
        '<div class="lwe-rbar-bg"><div class="lwe-rbar-fill" data-pct="' + r.pct + '" style="background:' + r.color + ';"></div></div>' +
      '</div>';
    }).join('');
  }

  /* ─────────────────────────────────────────────────────────────
     MINI-LISTA DE EPISODIOS de la temporada
  ───────────────────────────────────────────────────────────── */
  function renderMiniEpList(episodes, season, currentEp) {
    var cont  = document.getElementById('lwe-ep-scroll');
    var today = new Date();

    cont.innerHTML = episodes.map(function (ep) {
      var epNum      = ep.episode_number;
      var title      = ep.name || ('Episodio ' + epNum);
      var airDate    = ep.air_date ? new Date(ep.air_date) : null;
      var isUnlocked = airDate ? (airDate <= today) : false;
      var isCurrent  = epNum === currentEp;
      var sxe        = season + 'x' + epNum;
      var epUrl      = buildEpUrl(season, epNum);
      var thumb      = ep.still_path ? 'https://image.tmdb.org/t/p/w185' + ep.still_path : '';

      var dateStr = '';
      if (airDate) {
        try { dateStr = airDate.toLocaleDateString('es-MX', { day:'numeric', month:'short', year:'numeric' }); }
        catch(e) { dateStr = ep.air_date; }
      }

      var thumbHtml = '<div class="lwe-ep-mini-thumb">' +
        (thumb
          ? '<img src="' + thumb + '" alt="' + esc(title) + '" loading="lazy">'
          : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#2a2a2a;font-size:1rem;">▶</div>') +
        '<span class="lwe-ep-mini-num">' + esc(sxe) + '</span>' +
        (!isUnlocked ? '<div class="lwe-ep-mini-lock">🔒</div>' : '') +
      '</div>';

      var infoHtml = '<div style="min-width:0;flex:1;">' +
        '<div class="lwe-ep-mini-title">' + esc(title) + '</div>' +
        (dateStr ? '<div class="lwe-ep-mini-date">' + dateStr + '</div>' : '') +
      '</div>';

      var dotHtml = isCurrent ? '<div class="lwe-ep-mini-current-dot"></div>' : '';

      var cls = 'lwe-ep-item' + (isCurrent ? ' current' : '') + (!isUnlocked ? ' locked' : '');

      /* El episodio actual no es clickeable (ya estamos en él) */
      if (isUnlocked && !isCurrent) {
        return '<a href="' + epUrl + '" class="' + cls + '">' + thumbHtml + infoHtml + dotHtml + '</a>';
      }
      return '<div class="' + cls + '">' + thumbHtml + infoHtml + dotHtml + '</div>';
    }).join('');
  }

  /* ─────────────────────────────────────────────────────────────
     NAVEGACIÓN ANTERIOR / SIGUIENTE
  ───────────────────────────────────────────────────────────── */
  function renderNavigation(episodes, season, currentEp) {
    var today  = new Date();
    var sorted = episodes.slice().sort(function (a, b) { return a.episode_number - b.episode_number; });
    var prevEp = null, nextEp = null;

    sorted.forEach(function (ep) {
      if (ep.episode_number < currentEp) {
        prevEp = ep;
      }
      if (ep.episode_number > currentEp && !nextEp) {
        var airDate = ep.air_date ? new Date(ep.air_date) : null;
        /* Solo mostrar "Siguiente" si el episodio ya se emitió */
        if (!airDate || airDate <= today) nextEp = ep;
      }
    });

    var prevBtn = document.getElementById('lwe-prev-btn');
    var nextBtn = document.getElementById('lwe-next-btn');

    if (prevEp) {
      prevBtn.href = buildEpUrl(season, prevEp.episode_number);
      prevBtn.classList.remove('disabled');
      document.getElementById('lwe-prev-title').textContent = prevEp.name || (season + 'x' + prevEp.episode_number);
    }
    if (nextEp) {
      nextBtn.href = buildEpUrl(season, nextEp.episode_number);
      nextBtn.classList.remove('disabled');
      document.getElementById('lwe-next-title').textContent = nextEp.name || (season + 'x' + nextEp.episode_number);
    }
  }

  /* ─────────────────────────────────────────────────────────────
     REPRODUCTOR — idioma + servidores
  ───────────────────────────────────────────────────────────── */
  function getActiveLangServers() {
    var lang = LW_LANGS.find(function (l) { return l.key === activeLangKey; });
    return (lang && lang.servers) ? lang.servers : [];
  }

  function buildLangSelector() {
    var sel = document.getElementById('lwe-lang-select');
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
    if (cur) document.getElementById('lwe-lang-flag').textContent = cur.flag;
  }

  function renderServers() {
    buildLangSelector();
    var servers = getActiveLangServers();
    var cont    = document.getElementById('lwe-server-tabs');
    if (!servers.length) {
      cont.innerHTML = '<span style="color:#555;font-size:.8rem;">Sin servidores para este idioma.</span>';
      return;
    }
    cont.innerHTML = servers.map(function (s, i) {
      return '<button class="lwe-server-tab ' + (i === 0 ? 'active' : '') + '" onclick="lweSwitchServer(this,' + i + ')">' + esc(s.name) + '</button>';
    }).join('');
    activeServer = 0;
    document.getElementById('lwe-play-label').textContent = 'Reproducir: ' + servers[0].name;
  }

  /* ─────────────────────────────────────────────────────────────
     INTERACTIVIDAD — funciones globales
  ───────────────────────────────────────────────────────────── */

  /* Cambia idioma */
  window.lweChangeLang = function (sel) {
    activeLangKey = sel.value;
    var lang = LW_LANGS.find(function (l) { return l.key === activeLangKey; });
    document.getElementById('lwe-lang-flag').textContent = lang ? lang.flag : '🌐';
    resetPlayer();
    var servers = getActiveLangServers();
    var cont    = document.getElementById('lwe-server-tabs');
    cont.innerHTML = servers.map(function (s, i) {
      return '<button class="lwe-server-tab ' + (i === 0 ? 'active' : '') + '" onclick="lweSwitchServer(this,' + i + ')">' + esc(s.name) + '</button>';
    }).join('');
    activeServer = 0;
    document.getElementById('lwe-play-label').textContent = servers.length ? ('Reproducir: ' + servers[0].name) : 'Reproducir';
    lweToast('OK', (lang ? lang.flag + ' ' : '') + (lang ? lang.label : sel.value));
  };

  /* Cambia servidor activo */
  window.lweSwitchServer = function (el, idx) {
    activeServer = idx;
    document.querySelectorAll('.lwe-server-tab').forEach(function (t) { t.classList.remove('active'); });
    el.classList.add('active');
    resetPlayer();
    document.getElementById('lwe-play-label').textContent = 'Reproducir: ' + el.textContent;
    lweToast('OK', 'Servidor: ' + el.textContent);
  };

  /* Inicia el reproductor al hacer clic en play */
  window.lweStartPlayer = function () {
    var servers = getActiveLangServers();
    var server  = servers[activeServer] || { name: '?', url: '' };
    var pw      = document.getElementById('lwe-player-wrap');
    var overlay = document.getElementById('lwe-play-overlay');
    var poster  = document.getElementById('lwe-player-poster');

    /* Quita player anterior si existe */
    var existing = document.getElementById('lwe-active-player');
    if (existing) existing.remove();

    var div = document.createElement('div');
    div.id = 'lwe-active-player';
    div.style.cssText = 'position:absolute;inset:0;z-index:20;';

    if (server.url && server.url.trim() !== '') {
      /* ✅ Tiene URL: carga el iframe */
      var iframe = document.createElement('iframe');
      iframe.src = server.url;
      iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
      iframe.allowFullscreen = true;
      div.appendChild(iframe);

      pw.appendChild(div);
      /* Oculta el overlay DESPUÉS de agregar el iframe */
      overlay.style.display = 'none';
      poster.style.display  = 'none';

    } else {
      /* ⚠️ Sin URL: muestra mensaje, NO crea iframe (evita spinner infinito) */
      div.style.cssText += 'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:#0d0d0d;';
      var langLabel = (LW_LANGS.find(function (l) { return l.key === activeLangKey; }) || {}).label || activeLangKey;
      div.innerHTML =
        '<svg style="width:42px;height:42px;color:#00b4ff;" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>' +
        '<p style="color:#555;font-size:.82rem;font-family:Outfit,sans-serif;text-align:center;padding:0 24px;">' +
          'Servidor: <strong style="color:#e0e0e0;">' + esc(server.name) + '</strong> — ' +
          'Idioma: <strong style="color:#00b4ff;">' + esc(langLabel) + '</strong><br>' +
          '<span style="color:#333;font-size:.72rem;margin-top:4px;display:block;">Agrega la URL del embed en LW_LANGS para activar este servidor</span>' +
        '</p>';

      pw.appendChild(div);
      overlay.style.display = 'none';
      poster.style.display  = 'none';
    }
  };

  /* ─────────────────────────────────────────────────────────────
     HELPERS INTERNOS
  ───────────────────────────────────────────────────────────── */

  /* Resetea el reproductor al estado inicial (overlay visible) */
  function resetPlayer() {
    var existing = document.getElementById('lwe-active-player');
    if (existing) existing.remove();
    document.getElementById('lwe-play-overlay').style.display = 'flex';
    document.getElementById('lwe-player-poster').style.display = 'block';
  }

  function hideLoading() {
    var el = document.getElementById('lwe-loading');
    if (el) el.style.display = 'none';
  }

  function showWidget() {
    document.getElementById('lwe-widget').style.display = 'block';
    /* Detiene el spinner de carga del navegador */
    try { window.stop(); } catch(e) {}
  }

  function showError(msg) {
    hideLoading();
    var wrap = document.getElementById('lwe-widget');
    wrap.style.display = 'block';
    wrap.innerHTML = '<div class="lwe-error">⚠️ ' + msg + '</div>';
  }

  function lweToast(icon, msg) {
    clearTimeout(toastTimer);
    document.getElementById('lwe-toast-icon').textContent = icon;
    document.getElementById('lwe-toast-msg').textContent  = msg;
    document.getElementById('lwe-toast').classList.add('lwe-show');
    toastTimer = setTimeout(function () {
      document.getElementById('lwe-toast').classList.remove('lwe-show');
    }, 2800);
  }

  /* ─────────────────────────────────────────────────────────────
     COMPARTIR
  ───────────────────────────────────────────────────────────── */
  window.lweShare = function (net) {
    var url   = encodeURIComponent(window.location.href);
    var title = encodeURIComponent(document.title);
    var links = {
      twitter:  'https://twitter.com/intent/tweet?text=' + title + '&url=' + url,
      facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + url,
    };
    if (links[net]) window.open(links[net], '_blank', 'width=600,height=400');
    lweToast('OK', 'Compartiendo en ' + net + '…');
  };
  window.lweCopyLink = function () {
    try { navigator.clipboard.writeText(window.location.href); } catch(e) {}
    lweToast('OK', 'Enlace copiado');
  };

  /* ─────────────────────────────────────────────────────────────
     SEO — Schema.org TVEpisode
  ───────────────────────────────────────────────────────────── */
  function injectSEO(d) {
    var sxe      = d.season + 'x' + d.epNum;
    var seoTitle = d.serieTitle + ' ' + sxe + ' - ' + d.epTitle + ' | Ver Online Latino';
    var seoDesc  = (d.epOverview || '').slice(0, 160);
    var seoImg   = d.still || d.poster || '';
    var seoUrl   = window.location.href;

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
    setName('robots',              'index, follow');
    setProp('og:title',            seoTitle);
    setProp('og:description',      seoDesc);
    setProp('og:image',            seoImg);
    setProp('og:url',              seoUrl);
    setProp('og:type',             'video.episode');
    setProp('og:locale',           'es_MX');
    setName('twitter:card',        'summary_large_image');
    setName('twitter:title',       seoTitle);
    setName('twitter:description', seoDesc);
    setName('twitter:image',       seoImg);

    var canon = document.querySelector('link[rel="canonical"]');
    if (!canon) { canon = document.createElement('link'); canon.setAttribute('rel','canonical'); document.head.appendChild(canon); }
    canon.setAttribute('href', seoUrl);

    /* JSON-LD Schema.org TVEpisode */
    var jsonLd = {
      '@context':     'https://schema.org',
      '@type':        'TVEpisode',
      'name':          d.epTitle,
      'episodeNumber': d.epNum,
      'partOfSeason': {
        '@type':        'TVSeason',
        'seasonNumber':  d.season
      },
      'partOfSeries': {
        '@type': 'TVSeries',
        'name':   d.serieTitle,
        'url':    LW_SERIE_URL || ''
      },
      'description':   d.epOverview,
      'image':         seoImg,
      'datePublished': d.epDate,
      'url':           seoUrl,
      'inLanguage':    'es'
    };

    var ld = document.getElementById('lwe-jsonld') || (function () {
      var s = document.createElement('script');
      s.type = 'application/ld+json';
      s.id   = 'lwe-jsonld';
      document.head.appendChild(s);
      return s;
    })();
    ld.textContent = JSON.stringify(jsonLd, null, 2);
  }

  /* Arranca cuando el DOM está listo */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
