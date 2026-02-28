(function () {
  'use strict';

  /* ── Inyecta el HTML del widget ── */
  (function injectHTML() {
    var html = [
      '<div id="lwe-seo-container" style="display:none;" aria-hidden="true"></div>',
      '<div id="lwe-loading">',
        '<div class="lwe-spinner"></div>',
        '<p id="lwe-loading-msg" style="color:#555;font-size:.85rem;">Cargando episodio…</p>',
      '</div>',
      '<div id="lwe-widget" style="display:none;">',
        '<div id="lwe-hero-wrap">',
          '<div id="lwe-hero-bg"></div>',
          '<div id="lwe-hero-overlay"></div>',
          '<div id="lwe-hero-bottom"></div>',
          '<div id="lwe-hero-content">',
            '<a id="lwe-serie-back" href="#">',
              '<svg style="width:13px;height:13px;flex-shrink:0;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M15 19l-7-7 7-7"/></svg>',
              '<span id="lwe-serie-name">Volver a la serie</span>',
            '</a>',
            '<h1 id="lwe-ep-title" class="lwe-fade"></h1>',
            '<div id="lwe-ep-subtitle" class="lwe-fade lwe-d1"></div>',
            '<div id="lwe-meta-row" class="lwe-fade lwe-d2"></div>',
            '<div id="lwe-genres-row" class="lwe-fade lwe-d3"></div>',
          '</div>',
        '</div>',
        '<div id="lwe-main-grid">',
          '<div class="lwe-col-left">',
            '<div class="lwe-section">',
              '<div class="lwe-player-header">',
                '<span class="lwe-sec-title" style="margin-bottom:0;">Ver Ahora</span>',
                '<div class="lwe-lang-wrap">',
                  '<span id="lwe-lang-flag" style="font-size:1.1rem;">🌐</span>',
                  '<div style="position:relative;">',
                    '<select id="lwe-lang-select" class="lwe-lang-select" onchange="lweChangeLang(this)"></select>',
                    '<svg class="lwe-select-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M19 9l-7 7-7-7"/></svg>',
                  '</div>',
                '</div>',
              '</div>',
              '<div id="lwe-server-tabs"></div>',
              '<div id="lwe-player-wrap">',
                '<div id="lwe-player-poster"></div>',
                '<div id="lwe-play-overlay" onclick="lweStartPlayer()">',
                  '<div class="lwe-play-btn">',
                    '<svg style="width:32px;height:32px;margin-left:4px;" viewBox="0 0 20 20" fill="white"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>',
                  '</div>',
                  '<span id="lwe-play-label" style="color:rgba(255,255,255,.65);font-size:.88rem;font-weight:600;">Reproducir</span>',
                '</div>',
              '</div>',
              '<p class="lwe-quality-note">',
                '<svg style="width:13px;height:13px;color:#00b4ff;flex-shrink:0;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>',
                'Si el reproductor no carga, prueba con otro servidor. <span style="color:#e0e0e0;font-weight:600;">1080p HD</span>',
              '</p>',
            '</div>',
            '<div id="lwe-nav-row">',
              '<a id="lwe-prev-btn" class="lwe-nav-btn disabled" href="#">',
                '<svg style="width:16px;height:16px;flex-shrink:0;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M15 19l-7-7 7-7"/></svg>',
                '<div class="lwe-nav-info"><div class="lwe-nav-label">Anterior</div><div id="lwe-prev-title" class="lwe-nav-title">—</div></div>',
              '</a>',
              '<a id="lwe-next-btn" class="lwe-nav-btn disabled" href="#" style="justify-content:flex-end;text-align:right;">',
                '<div class="lwe-nav-info"><div class="lwe-nav-label">Siguiente</div><div id="lwe-next-title" class="lwe-nav-title">—</div></div>',
                '<svg style="width:16px;height:16px;flex-shrink:0;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M9 5l7 7-7 7"/></svg>',
              '</a>',
            '</div>',
            '<div class="lwe-section">',
              '<span class="lwe-sec-title">Sobre este episodio</span>',
              '<p id="lwe-ep-overview" style="color:#8a8a8a;line-height:1.75;font-size:.92rem;"></p>',
            '</div>',
            '<div class="lwe-section">',
              '<div class="lwe-eplist-header">',
                '<span class="lwe-sec-title" style="margin-bottom:0;">Temporada <span id="lwe-ep-list-season">1</span></span>',
                '<a id="lwe-ver-todos" href="#" class="lwe-ver-todos-link">Ver todos ↗</a>',
              '</div>',
              '<div id="lwe-ep-scroll"></div>',
            '</div>',
          '</div>',
          '<div class="lwe-col-right">',
            '<div id="lwe-info-panel">',
              '<div class="lwe-info-section lwe-info-top">',
                '<div class="lwe-poster-thumb">',
                  '<img id="lwe-poster" src="" alt="Poster" onerror="this.src=\'https://via.placeholder.com/150x225/1a1a1a/555?text=N/A\'">',
                '</div>',
                '<div style="min-width:0;">',
                  '<div class="lwe-info-label">Serie</div>',
                  '<div id="lwe-panel-title" class="lwe-panel-title"></div>',
                  '<div id="lwe-panel-original" class="lwe-panel-original"></div>',
                  '<div id="lwe-panel-genres"></div>',
                '</div>',
              '</div>',
              '<div class="lwe-info-section">',
                '<div class="lwe-info-label">Calificación de la serie</div>',
                '<div id="lwe-ratings"></div>',
              '</div>',
              '<div class="lwe-info-section">',
                '<div class="lwe-info-label">Ficha del episodio</div>',
                '<div id="lwe-ficha"></div>',
              '</div>',
              '<div class="lwe-info-section">',
                '<div class="lwe-info-label">Compartir episodio</div>',
                '<div style="display:flex;gap:8px;">',
                  '<button class="lwe-share-btn" onclick="lweShare(\'twitter\')"><svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>Twitter</button>',
                  '<button class="lwe-share-btn" onclick="lweShare(\'facebook\')"><svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>Facebook</button>',
                  '<button class="lwe-share-btn" onclick="lweCopyLink()"><svg style="width:14px;height:14px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>Copiar</button>',
                '</div>',
              '</div>',
            '</div>',
          '</div>',
        '</div>',
      '</div>',
      '<div id="lwe-toast"><div id="lwe-toast-inner">',
        '<span id="lwe-toast-icon" style="font-weight:700;color:#00b4ff;font-size:.9rem;">OK</span>',
        '<span id="lwe-toast-msg">Listo</span>',
      '</div></div>',
    ].join('');

    var scripts = document.getElementsByTagName('script');
    var configScript = null;
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].textContent.indexOf('LW_EPISODE') !== -1) { configScript = scripts[i]; break; }
    }
    function doInsert() {
      var container = document.createElement('div');
      container.innerHTML = html;
      if (configScript && configScript.parentNode) {
        configScript.parentNode.insertBefore(container, configScript.nextSibling);
      } else if (document.body) {
        document.body.appendChild(container);
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', doInsert);
    } else {
      doInsert();
    }
  })();

  /* ─────────────────────────────────────────────────────────────
     CLAVE DE API
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
  function extractTmdbId(input) { if(!input) return null; var s=String(input).trim(); if(/^\d+$/.test(s)) return parseInt(s); var m=s.match(/\/(tv|movie)\/(\d+)/); return m?parseInt(m[2]):null; }
  function extractMalId(input)  { if(!input) return null; var s=String(input).trim(); if(/^\d+$/.test(s)) return parseInt(s); var m=s.match(/\/anime\/(\d+)/); return m?parseInt(m[1]):null; }
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function fmtVotes(n) { n=parseInt(String(n).replace(/,/g,'')); if(isNaN(n)||n===0) return ''; if(n>=1000000) return (n/1000000).toFixed(1)+'M'; if(n>=1000) return Math.round(n/1000)+'k'; return String(n); }
  function apiFetch(url) { return fetch(url).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); }); }
  function hideLoading() { var el=document.getElementById('lwe-loading'); if(el) el.style.display='none'; }
  function showWidget() { document.getElementById('lwe-widget').style.display='block'; try{window.stop();}catch(e){} }
  function showError(msg) { hideLoading(); var w=document.getElementById('lwe-widget'); w.style.display='block'; w.innerHTML='<div class="lwe-error">⚠️ '+msg+'</div>'; }
  function lweToast(icon,msg) { clearTimeout(toastTimer); document.getElementById('lwe-toast-icon').textContent=icon; document.getElementById('lwe-toast-msg').textContent=msg; document.getElementById('lwe-toast').classList.add('lwe-show'); toastTimer=setTimeout(function(){ document.getElementById('lwe-toast').classList.remove('lwe-show'); },2800); }

  function buildEpUrl(season, epNum) {
    var base=(LW_BLOG_URL||window.location.origin).replace(/\/+$/,'');
    var date=(LW_DATE||'').replace(/\/+$/,'');
    return date?base+'/'+date+'/'+LW_SLUG+'-'+season+'x'+epNum+'.html':base+'/'+LW_SLUG+'-'+season+'x'+epNum+'.html';
  }

  /* ─────────────────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────────────────── */
  function init() {
    var malId  = extractMalId(LW_MAL_ID)   || 0;
    var tmdbId = extractTmdbId(LW_TMDB_ID) || 0;
    var season = parseInt(LW_SEASON)  || 1;
    var epNum  = parseInt(LW_EPISODE) || 1;

    if (!tmdbId) { showError('Define LW_TMDB_ID en la Sección 1.'); hideLoading(); return; }

    var blogBase=(LW_BLOG_URL||window.location.origin).replace(/\/+$/,'');
    if (LW_SERIE_URL && LW_SERIE_URL.charAt(0)==='/') LW_SERIE_URL=blogBase+LW_SERIE_URL;

    var firstLang=LW_LANGS.find(function(l){ return l.enabled; });
    activeLangKey=firstLang?firstLang.key:'';

    document.getElementById('lwe-loading-msg').textContent='Cargando episodio '+season+'x'+epNum+'…';

    var jikanP = malId
      ? apiFetch('https://api.jikan.moe/v4/anime/'+malId)
          .catch(function(){ return new Promise(function(res){ setTimeout(function(){ apiFetch('https://api.jikan.moe/v4/anime/'+malId).then(res).catch(function(){ res(null); }); },1200); }); })
      : Promise.resolve(null);

    var tmdbShowP   = apiFetch('https://api.themoviedb.org/3/tv/'+tmdbId+'?api_key='+TMDB_KEY+'&language=es-MX');
    var tmdbSeasonP = apiFetch('https://api.themoviedb.org/3/tv/'+tmdbId+'/season/'+season+'?api_key='+TMDB_KEY+'&language=es-MX');

    Promise.all([jikanP, tmdbShowP, tmdbSeasonP])
      .then(function(res){
        var jikanRaw=res[0];
        var jikan=jikanRaw&&jikanRaw.data?jikanRaw.data:jikanRaw;
        var show=res[1];
        var seasonData=res[2];
        allEpisodes=seasonData.episodes||[];
        var ep=allEpisodes.find(function(e){ return e.episode_number===epNum; })||allEpisodes[epNum-1]||{};
        var data=buildData(jikan,show,ep,season,epNum,tmdbId);
        renderWidget(data);
        renderMiniEpList(allEpisodes,season,epNum);
        renderNavigation(allEpisodes,season,epNum);
        renderServers();
        hideLoading();
        showWidget();
        setTimeout(function(){
          var cur=document.querySelector('.lwe-ep-item.current');
          if(cur) cur.scrollIntoView({behavior:'smooth',block:'nearest'});
          document.querySelectorAll('.lwe-rbar-fill[data-pct]').forEach(function(b){ b.style.width=Math.min(parseFloat(b.getAttribute('data-pct')),100)+'%'; });
        },400);
      })
      .catch(function(err){ console.error(err); showError('No se pudo conectar con las APIs. Verifica los IDs en la Sección 1.'); hideLoading(); });
  }

  /* ─────────────────────────────────────────────────────────────
     BUILD DATA
  ───────────────────────────────────────────────────────────── */
  function buildData(jikan, show, ep, season, epNum, tmdbId) {
    var titleEs='',titleRomanized='',titleOriginal='';
    if (jikan){ titleRomanized=jikan.title||''; titleOriginal=jikan.title_japanese||''; if(jikan.titles){ var t=jikan.titles.find(function(t){ return t.type==='Spanish'||/[áéíóúñ]/i.test(t.title||''); }); if(t) titleEs=t.title; } if(!titleEs) titleEs=jikan.title_english||titleRomanized; }
    if (!titleEs&&show) titleEs=show.name||show.original_name||'Sin título';
    if (!titleRomanized&&show) titleRomanized=show.original_name||'';
    var serieTitle=titleEs||titleRomanized||'Sin título';

    var poster='';
    if (jikan&&jikan.images&&jikan.images.jpg) poster=jikan.images.jpg.large_image_url||jikan.images.jpg.image_url||'';
    if (!poster&&show&&show.poster_path) poster='https://image.tmdb.org/t/p/w500'+show.poster_path;

    var still=ep.still_path?'https://image.tmdb.org/t/p/original'+ep.still_path:(show&&show.backdrop_path?'https://image.tmdb.org/t/p/original'+show.backdrop_path:'');
    var stillPath=ep.still_path||'';

    var genreMap={'Action':'Acción','Adventure':'Aventura','Comedy':'Comedia','Drama':'Drama','Fantasy':'Fantasía','Horror':'Terror','Mystery':'Misterio','Romance':'Romance','Sci-Fi':'Ciencia ficción','Science Fiction':'Ciencia ficción','Slice of Life':'Vida cotidiana','Sports':'Deportes','Supernatural':'Sobrenatural','Thriller':'Suspenso','Music':'Música','Psychological':'Psicológico','Mecha':'Mecha','Isekai':'Isekai','Historical':'Histórico','Military':'Militar','School':'Escolar','Magic':'Magia','Animation':'Animación'};
    var genres=jikan?(jikan.genres||[]).concat(jikan.themes||[]).map(function(g){ return genreMap[g.name]||g.name; }):(show&&show.genres?show.genres.map(function(g){ return genreMap[g.name]||g.name; }):[]);

    var ratings=[];
    if (show&&show.vote_average>0) ratings.push({source:'TMDB',icon:'TMDB',score:show.vote_average.toFixed(1)+' / 10',votes:show.vote_count?fmtVotes(show.vote_count):'',pct:(show.vote_average/10)*100,color:'#01d277'});
    if (jikan&&jikan.score>0) ratings.push({source:'MyAnimeList',icon:'MAL',score:jikan.score.toFixed(2)+' / 10',votes:jikan.scored_by?fmtVotes(jikan.scored_by):'',pct:(jikan.score/10)*100,color:'#2e51a2'});

    var epDate='N/D';
    if (ep.air_date){ try{ epDate=new Date(ep.air_date).toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'}); }catch(e){ epDate=ep.air_date; } }

    var runtime='N/D';
    if (ep.runtime) runtime=ep.runtime+' min';
    else if (show&&show.episode_run_time&&show.episode_run_time.length) runtime=show.episode_run_time[0]+' min';
    else if (jikan&&jikan.duration) runtime=jikan.duration.replace(/ per ep\.?/i,'').trim();

    var studio=jikan?(jikan.studios||[]).map(function(s){ return s.name; }).join(', '):(show&&show.networks?show.networks.slice(0,2).map(function(n){ return n.name; }).join(', '):'');
    if (!studio) studio='N/D';

    var statusMap={'Finished Airing':'Finalizado','Currently Airing':'En emisión','Ended':'Finalizado','Returning Series':'En emisión'};
    var status='';
    if (show&&show.status) status=statusMap[show.status]||show.status;
    if (!status&&jikan&&jikan.status) status=statusMap[jikan.status]||jikan.status;

    return {
      serieTitle,titleRomanized,titleOriginal,poster,still,stillPath,genres,ratings,studio,status,
      epTitle:ep.name||('Episodio '+epNum),
      epOverview:ep.overview||'Sin sinopsis disponible para este episodio.',
      epDate,runtime,season,epNum,
      epRating:ep.vote_average||0,epVoteCount:ep.vote_count||0,
      totalEps:(show&&show.number_of_episodes)||allEpisodes.length,
      malId:(jikan&&jikan.mal_id)||0,tmdbId
    };
  }

  /* ─────────────────────────────────────────────────────────────
     RENDER WIDGET
  ───────────────────────────────────────────────────────────── */
  function renderWidget(d) {
    var blogBase=(LW_BLOG_URL||window.location.origin).replace(/\/+$/,'');

    if (d.still) document.getElementById('lwe-hero-bg').style.backgroundImage="url('"+d.still+"')";
    if (d.still||d.poster) document.getElementById('lwe-player-poster').style.backgroundImage="url('"+(d.still||d.poster)+"')";

    /* Imagen para el feed de Blogger */
    (function(){
      var imgUrl=d.stillPath?'https://image.tmdb.org/t/p/original'+d.stillPath:(d.poster||'');
      if (!imgUrl) return;
      var wrap=document.createElement('div'); wrap.id='lwe-feed-poster'; wrap.className='poster-container'; wrap.style.display='none';
      var img=document.createElement('img'); img.src=imgUrl; img.alt=d.serieTitle+' '+d.season+'x'+d.epNum; wrap.appendChild(img);
      var loading=document.getElementById('lwe-loading');
      if (loading&&loading.parentNode) loading.parentNode.insertBefore(wrap,loading);
    })();

    document.getElementById('lwe-serie-back').href=LW_SERIE_URL||'#';
    document.getElementById('lwe-serie-name').textContent=d.serieTitle;
    document.getElementById('lwe-ep-title').textContent=d.epTitle;

    var sxe=d.season+'x'+d.epNum;
    document.getElementById('lwe-ep-subtitle').innerHTML=
      '<span style="color:#8a8a8a;font-size:.85rem;font-weight:500;">'+esc(d.serieTitle)+'</span>'+
      '<span style="width:1px;height:12px;background:#2a2a2a;display:inline-block;"></span>'+
      '<span class="lwe-badge-ep">'+sxe+'</span>';

    var sep='<span style="width:1px;height:14px;background:#2a2a2a;display:inline-block;"></span>';
    var meta=[];
    if (d.epRating>0) meta.push('<span style="color:#f5c518;font-weight:700;font-size:.88rem;">★ '+d.epRating.toFixed(1)+(d.epVoteCount?' <span style="color:#555;font-weight:400;font-size:.75rem;">('+fmtVotes(d.epVoteCount)+')</span>':'')+'</span>');
    if (d.epDate!=='N/D') meta.push(sep+'<span style="color:#8a8a8a;font-size:.82rem;">📅 '+esc(d.epDate)+'</span>');
    if (d.runtime!=='N/D') meta.push(sep+'<span style="color:#8a8a8a;font-size:.82rem;">⏱ '+esc(d.runtime)+'</span>');
    document.getElementById('lwe-meta-row').innerHTML=meta.join('');

    document.getElementById('lwe-genres-row').innerHTML=d.genres.map(function(g){ return '<a href="'+blogBase+'/search/label/'+encodeURIComponent(g)+'" class="lwe-genre-pill" rel="tag">'+esc(g)+'</a>'; }).join('');
    document.getElementById('lwe-ep-overview').textContent=d.epOverview;
    document.getElementById('lwe-ep-list-season').textContent=d.season;
    document.getElementById('lwe-ver-todos').href=LW_SERIE_URL||'#';

    if (d.poster) document.getElementById('lwe-poster').src=d.poster;
    var panelMain=d.titleRomanized||d.serieTitle;
    document.getElementById('lwe-panel-title').textContent=panelMain;
    var sub='<div style="font-size:.7rem;color:#666;margin-bottom:3px;"><span style="color:#444;font-weight:700;text-transform:uppercase;font-size:.6rem;letter-spacing:.1em;margin-right:4px;">ROM</span>'+esc(panelMain)+'</div>';
    if (d.serieTitle&&d.serieTitle!==panelMain) sub+='<div style="font-size:.7rem;color:#666;margin-bottom:3px;"><span style="color:#444;font-weight:700;text-transform:uppercase;font-size:.6rem;letter-spacing:.1em;margin-right:4px;">ES</span>'+esc(d.serieTitle)+'</div>';
    if (d.titleOriginal&&d.titleOriginal!==panelMain&&d.titleOriginal!==d.serieTitle) sub+='<div style="font-size:.7rem;color:#555;"><span style="color:#444;font-weight:700;text-transform:uppercase;font-size:.6rem;letter-spacing:.1em;margin-right:4px;">ORI</span>'+esc(d.titleOriginal)+'</div>';
    document.getElementById('lwe-panel-original').innerHTML=sub;
    document.getElementById('lwe-panel-genres').innerHTML=d.genres.slice(0,4).map(function(g){ return '<a href="'+blogBase+'/search/label/'+encodeURIComponent(g)+'" class="lwe-genre-chip-link" rel="tag">'+esc(g)+'</a>'; }).join('');

    renderRatings(d.ratings);

    var rows=[['Temporada','T'+d.season],['Episodio',d.season+'x'+d.epNum],['Duración',d.runtime],['Emisión',d.epDate],['Estudio',d.studio]];
    if (d.status) rows.push(['Estado',d.status]);
    if (d.totalEps) rows.push(['Total eps',String(d.totalEps)]);
    if (d.malId) rows.push(['MAL','<a href="https://myanimelist.net/anime/'+d.malId+'" target="_blank" rel="noopener" style="color:#2e51a2;">Ver en MAL ↗</a>']);
    if (d.tmdbId) rows.push(['TMDB','<a href="https://www.themoviedb.org/tv/'+d.tmdbId+'/season/'+d.season+'/episode/'+d.epNum+'" target="_blank" rel="noopener" style="color:#01d277;">Ver en TMDB ↗</a>']);
    document.getElementById('lwe-ficha').innerHTML=rows.map(function(r){ return '<div style="display:flex;justify-content:space-between;gap:8px;"><span style="color:#666;">'+r[0]+'</span><span style="color:#e0e0e0;font-weight:500;text-align:right;">'+r[1]+'</span></div>'; }).join('');

    injectSEO(d);
  }

  function renderRatings(ratings) {
    var el=document.getElementById('lwe-ratings');
    if (!ratings.length){ el.innerHTML='<p style="color:#555;font-size:.8rem;">Sin calificaciones disponibles.</p>'; return; }
    el.innerHTML=ratings.map(function(r){ var badge=r.icon==='MAL'?'<span class="lwe-badge-mal">MAL</span>':'<span class="lwe-badge-tmdb">TMDB</span>'; return '<div><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;"><div style="display:flex;align-items:center;gap:8px;">'+badge+'<span style="font-weight:700;color:#fff;font-size:.88rem;">'+esc(r.score)+(r.votes?' <span style="color:#666;font-size:.75rem;">('+esc(r.votes)+')</span>':'')+'</span></div><span style="color:#555;font-size:.75rem;">'+esc(r.source)+'</span></div><div class="lwe-rbar-bg"><div class="lwe-rbar-fill" data-pct="'+r.pct+'" style="background:'+r.color+';"></div></div></div>'; }).join('');
  }

  /* ─────────────────────────────────────────────────────────────
     MINI-LISTA
  ───────────────────────────────────────────────────────────── */
  function renderMiniEpList(episodes, season, currentEp) {
    var cont=document.getElementById('lwe-ep-scroll'), today=new Date();
    cont.innerHTML=episodes.map(function(ep){
      var epNum=ep.episode_number, title=ep.name||('Episodio '+epNum);
      var airDate=ep.air_date?new Date(ep.air_date):null, isUnlocked=airDate?(airDate<=today):false;
      var isCurrent=epNum===currentEp, sxe=season+'x'+epNum, epUrl=buildEpUrl(season,epNum);
      var thumb=ep.still_path?'https://image.tmdb.org/t/p/w185'+ep.still_path:'';
      var dateStr=''; if(airDate){ try{ dateStr=airDate.toLocaleDateString('es-MX',{day:'numeric',month:'short',year:'numeric'}); }catch(e){ dateStr=ep.air_date; } }
      var thumbHtml='<div class="lwe-ep-mini-thumb">'+(thumb?'<img src="'+thumb+'" alt="'+esc(title)+'" loading="lazy">':'<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#2a2a2a;font-size:1rem;">▶</div>')+'<span class="lwe-ep-mini-num">'+esc(sxe)+'</span>'+(!isUnlocked?'<div class="lwe-ep-mini-lock">🔒</div>':'')+'</div>';
      var infoHtml='<div style="min-width:0;flex:1;"><div class="lwe-ep-mini-title">'+esc(title)+'</div>'+(dateStr?'<div class="lwe-ep-mini-date">'+dateStr+'</div>':'')+'</div>';
      var dotHtml=isCurrent?'<div class="lwe-ep-mini-current-dot"></div>':'';
      var cls='lwe-ep-item'+(isCurrent?' current':'')+(!isUnlocked?' locked':'');
      return isUnlocked&&!isCurrent?'<a href="'+epUrl+'" class="'+cls+'">'+thumbHtml+infoHtml+dotHtml+'</a>':'<div class="'+cls+'">'+thumbHtml+infoHtml+dotHtml+'</div>';
    }).join('');
  }

  /* ─────────────────────────────────────────────────────────────
     NAVEGACIÓN PREV / NEXT
  ───────────────────────────────────────────────────────────── */
  function renderNavigation(episodes, season, currentEp) {
    var today=new Date(), sorted=episodes.slice().sort(function(a,b){ return a.episode_number-b.episode_number; });
    var prevEp=null, nextEp=null;
    sorted.forEach(function(ep){
      if (ep.episode_number<currentEp) prevEp=ep;
      if (ep.episode_number>currentEp&&!nextEp){ var ad=ep.air_date?new Date(ep.air_date):null; if(!ad||ad<=today) nextEp=ep; }
    });
    var prevBtn=document.getElementById('lwe-prev-btn'), nextBtn=document.getElementById('lwe-next-btn');
    if (prevEp){ prevBtn.href=buildEpUrl(season,prevEp.episode_number); prevBtn.classList.remove('disabled'); document.getElementById('lwe-prev-title').textContent=prevEp.name||(season+'x'+prevEp.episode_number); }
    if (nextEp){ nextBtn.href=buildEpUrl(season,nextEp.episode_number); nextBtn.classList.remove('disabled'); document.getElementById('lwe-next-title').textContent=nextEp.name||(season+'x'+nextEp.episode_number); }
  }

  /* ─────────────────────────────────────────────────────────────
     REPRODUCTOR
  ───────────────────────────────────────────────────────────── */
  function getActiveLangServers() { var l=LW_LANGS.find(function(l){ return l.key===activeLangKey; }); return (l&&l.servers)?l.servers:[]; }

  function renderServers() {
    var sel=document.getElementById('lwe-lang-select'); sel.innerHTML='';
    LW_LANGS.forEach(function(l){ if(!l.enabled) return; var o=document.createElement('option'); o.value=l.key; o.textContent=l.flag+' '+l.label; if(l.key===activeLangKey) o.selected=true; sel.appendChild(o); });
    var cur=LW_LANGS.find(function(l){ return l.key===activeLangKey; });
    if (cur) document.getElementById('lwe-lang-flag').textContent=cur.flag;
    var servers=getActiveLangServers();
    document.getElementById('lwe-server-tabs').innerHTML=servers.map(function(s,i){ return '<button class="lwe-server-tab '+(i===0?'active':'')+'" onclick="lweSwitchServer(this,'+i+')">'+esc(s.name)+'</button>'; }).join('');
    activeServer=0;
    if (servers.length) document.getElementById('lwe-play-label').textContent='Reproducir: '+servers[0].name;
  }

  window.lweChangeLang = function(sel) {
    activeLangKey=sel.value;
    var lang=LW_LANGS.find(function(l){ return l.key===activeLangKey; });
    document.getElementById('lwe-lang-flag').textContent=lang?lang.flag:'🌐';
    resetPlayer();
    var servers=getActiveLangServers();
    document.getElementById('lwe-server-tabs').innerHTML=servers.map(function(s,i){ return '<button class="lwe-server-tab '+(i===0?'active':'')+'" onclick="lweSwitchServer(this,'+i+')">'+esc(s.name)+'</button>'; }).join('');
    activeServer=0;
    document.getElementById('lwe-play-label').textContent=servers.length?'Reproducir: '+servers[0].name:'Reproducir';
    lweToast('OK',(lang?lang.flag+' ':''+(lang?lang.label:sel.value)));
  };

  window.lweSwitchServer = function(el, idx) {
    activeServer=idx;
    document.querySelectorAll('.lwe-server-tab').forEach(function(t){ t.classList.remove('active'); });
    el.classList.add('active'); resetPlayer();
    document.getElementById('lwe-play-label').textContent='Reproducir: '+el.textContent;
    lweToast('OK','Servidor: '+el.textContent);
  };

  window.lweStartPlayer = function() {
    var servers=getActiveLangServers(), server=servers[activeServer]||{name:'?',url:''};
    var pw=document.getElementById('lwe-player-wrap');
    var existing=document.getElementById('lwe-active-player'); if(existing) existing.remove();
    var div=document.createElement('div'); div.id='lwe-active-player'; div.style.cssText='position:absolute;inset:0;z-index:20;';
    if (server.url&&server.url.trim()!==''){
      var iframe=document.createElement('iframe'); iframe.src=server.url; iframe.style.cssText='width:100%;height:100%;border:none;display:block;'; iframe.allowFullscreen=true;
      div.appendChild(iframe); pw.appendChild(div);
      document.getElementById('lwe-play-overlay').style.display='none';
      document.getElementById('lwe-player-poster').style.display='none';
    } else {
      var langLabel=(LW_LANGS.find(function(l){ return l.key===activeLangKey; })||{}).label||activeLangKey;
      div.style.cssText+='display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:#0d0d0d;';
      div.innerHTML='<svg style="width:42px;height:42px;color:#00b4ff;" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><p style="color:#555;font-size:.82rem;font-family:Outfit,sans-serif;text-align:center;padding:0 24px;">Servidor: <strong style="color:#e0e0e0;">'+esc(server.name)+'</strong> — Idioma: <strong style="color:#00b4ff;">'+esc(langLabel)+'</strong><br><span style="color:#333;font-size:.72rem;margin-top:4px;display:block;">Agrega la URL del embed en LW_LANGS</span></p>';
      pw.appendChild(div);
      document.getElementById('lwe-play-overlay').style.display='none';
      document.getElementById('lwe-player-poster').style.display='none';
    }
  };

  function resetPlayer() {
    var ex=document.getElementById('lwe-active-player'); if(ex) ex.remove();
    document.getElementById('lwe-play-overlay').style.display='flex';
    document.getElementById('lwe-player-poster').style.display='block';
  }

  window.lweShare = function(net){ var url=encodeURIComponent(window.location.href),title=encodeURIComponent(document.title),links={twitter:'https://twitter.com/intent/tweet?text='+title+'&url='+url,facebook:'https://www.facebook.com/sharer/sharer.php?u='+url}; if(links[net]) window.open(links[net],'_blank','width=600,height=400'); lweToast('OK','Compartiendo en '+net+'…'); };
  window.lweCopyLink = function(){ try{navigator.clipboard.writeText(window.location.href);}catch(e){} lweToast('OK','Enlace copiado'); };

  /* ─────────────────────────────────────────────────────────────
     SEO
  ───────────────────────────────────────────────────────────── */
  function injectSEO(d) {
    var sxe=d.season+'x'+d.epNum;
    var seoTitle=d.serieTitle+' '+sxe+' - '+d.epTitle+' | Ver Online Latino';
    var seoDesc=(d.epOverview||'').slice(0,160), seoImg=d.still||d.poster||'', seoUrl=window.location.href;
    try{document.title=seoTitle;}catch(e){}
    function setName(n,v){ var el=document.querySelector('meta[name="'+n+'"]'); if(!el){el=document.createElement('meta');el.setAttribute('name',n);document.head.appendChild(el);} el.setAttribute('content',v); }
    function setProp(p,v){ var el=document.querySelector('meta[property="'+p+'"]'); if(!el){el=document.createElement('meta');el.setAttribute('property',p);document.head.appendChild(el);} el.setAttribute('content',v); }
    setName('description',seoDesc); setName('robots','index, follow');
    setProp('og:title',seoTitle); setProp('og:description',seoDesc); setProp('og:image',seoImg); setProp('og:url',seoUrl); setProp('og:type','video.episode'); setProp('og:locale','es_MX');
    setName('twitter:card','summary_large_image'); setName('twitter:title',seoTitle); setName('twitter:description',seoDesc); setName('twitter:image',seoImg);
    var canon=document.querySelector('link[rel="canonical"]'); if(!canon){canon=document.createElement('link');canon.setAttribute('rel','canonical');document.head.appendChild(canon);} canon.setAttribute('href',seoUrl);
    var jsonLd={'@context':'https://schema.org','@type':'TVEpisode','name':d.epTitle,'episodeNumber':d.epNum,'partOfSeason':{'@type':'TVSeason','seasonNumber':d.season},'partOfSeries':{'@type':'TVSeries','name':d.serieTitle,'url':LW_SERIE_URL||''},'description':d.epOverview,'image':seoImg,'datePublished':d.epDate,'url':seoUrl,'inLanguage':'es'};
    var ld=document.getElementById('lwe-jsonld')||(function(){ var s=document.createElement('script');s.type='application/ld+json';s.id='lwe-jsonld';document.head.appendChild(s);return s; })();
    ld.textContent=JSON.stringify(jsonLd,null,2);
  }

  /* Solo corre si la página tiene config de episodio */
  function shouldRun() { try { return typeof LW_EPISODE !== 'undefined'; } catch(e) { return false; } }
  if (shouldRun()) {
    if (document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',init); } else { init(); }
  }

})();
