(function () {
  'use strict';

  /* ── Inyecta el HTML del widget ── */
  (function injectHTML() {
    var html = [
      '<div id="lws-seo-container" style="display:none;" aria-hidden="true"></div>',
      '<div id="lws-loading">',
        '<div class="lws-spinner"></div>',
        '<p id="lws-loading-msg" style="color:#555;font-size:.85rem;">Importando datos…</p>',
      '</div>',
      '<div id="lws-widget" style="display:none;">',
        '<div id="lws-hero-wrap">',
          '<div id="lws-hero-bg"></div>',
          '<div id="lws-hero-overlay"></div>',
          '<div id="lws-hero-bottom"></div>',
          '<div id="lws-hero-content">',
            '<h1 id="lws-title" class="lws-fade"></h1>',
            '<div id="lws-titles-extra" class="lws-fade lws-d1"></div>',
            '<div id="lws-meta-row" class="lws-fade lws-d2"></div>',
            '<div id="lws-genres-row" class="lws-fade lws-d3"></div>',
          '</div>',
        '</div>',
        '<div id="lws-main-grid">',
          '<div class="lws-col-left">',
            '<div class="lws-section">',
              '<span class="lws-sec-title">Sinopsis</span>',
              '<p id="lws-synopsis" class="lws-synopsis-text"></p>',
              '<button id="lws-syn-btn" onclick="lwsExpandSyn()" class="lws-syn-btn" style="display:none;">Leer más ▾</button>',
            '</div>',
            '<div id="lws-episodes-section" class="lws-section">',
              '<div class="lws-eps-header">',
                '<span class="lws-sec-title" style="margin-bottom:0;">Episodios</span>',
                '<div id="lws-season-tabs"></div>',
              '</div>',
              '<div class="lws-eps-toolbar">',
                '<div style="position:relative;flex:1;">',
                  '<svg class="lws-search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>',
                  '<input id="lws-ep-search" type="text" placeholder="Buscar episodio…" oninput="lwsFilterEpisodes()" autocomplete="off">',
                '</div>',
                '<button id="lws-sort-btn" onclick="lwsToggleSort(this)" title="Ordenar episodios">',
                  '<svg style="width:13px;height:13px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18M7 12h10M11 18h2"/></svg>',
                  '<span id="lws-sort-label">1-N</span>',
                '</button>',
              '</div>',
              '<div id="lws-ep-list"></div>',
              '<div id="lws-ep-empty" style="display:none;text-align:center;padding:24px 0;color:#444;font-size:.85rem;">Sin resultados para "<span id="lws-ep-empty-q"></span>"</div>',
            '</div>',
          '</div>',
          '<div class="lws-col-right">',
            '<div id="lws-info-panel">',
              '<div class="lws-info-section lws-info-top">',
                '<div class="lws-poster-thumb">',
                  '<img id="lws-poster" src="" alt="Poster" onerror="this.src=\'https://via.placeholder.com/150x225/1a1a1a/555?text=N/A\'">',
                '</div>',
                '<div style="min-width:0;">',
                  '<div class="lws-info-label">Información</div>',
                  '<div id="lws-panel-title" class="lws-panel-title"></div>',
                  '<div id="lws-panel-original" class="lws-panel-original"></div>',
                  '<div id="lws-panel-genres"></div>',
                '</div>',
              '</div>',
              '<div class="lws-info-section">',
                '<div class="lws-info-label">Estudio / Director</div>',
                '<span id="lws-director" style="color:#00b4ff;font-weight:600;font-size:.88rem;">…</span>',
              '</div>',
              '<div class="lws-info-section">',
                '<div class="lws-info-label">Calificación</div>',
                '<div id="lws-ratings"></div>',
              '</div>',
              '<div class="lws-info-section">',
                '<div class="lws-info-label">Ficha técnica</div>',
                '<div id="lws-ficha"></div>',
              '</div>',
              '<div class="lws-info-section" id="lws-trailer-section" style="display:none;">',
                '<div class="lws-info-label">Tráiler oficial</div>',
                '<div id="lws-trailer-panel" onclick="lwsOpenTrailer(lwsTrailerKey,lwsTrailerTitle)">',
                  '<img id="lws-trailer-img" src="" alt="Tráiler">',
                  '<div id="lws-trailer-panel-overlay">',
                    '<div id="lws-trailer-play-btn">',
                      '<svg style="width:20px;height:20px;margin-left:3px;" viewBox="0 0 20 20" fill="#000"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>',
                    '</div>',
                  '</div>',
                  '<div style="position:absolute;bottom:8px;left:10px;">',
                    '<span id="lws-trailer-label" style="color:#fff;font-size:.75rem;font-weight:600;text-shadow:0 1px 6px rgba(0,0,0,.9);background:rgba(0,0,0,.4);padding:2px 7px;border-radius:4px;">Tráiler oficial</span>',
                  '</div>',
                '</div>',
              '</div>',
              '<div class="lws-info-section">',
                '<div class="lws-info-label">Compartir</div>',
                '<div style="display:flex;gap:8px;">',
                  '<button class="lws-share-btn" onclick="lwsShare(\'twitter\')"><svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>Twitter</button>',
                  '<button class="lws-share-btn" onclick="lwsShare(\'facebook\')"><svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>Facebook</button>',
                  '<button class="lws-share-btn" onclick="lwsCopyLink()"><svg style="width:14px;height:14px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>Copiar</button>',
                '</div>',
              '</div>',
            '</div>',
          '</div>',
        '</div>',
      '</div>',
      '<div id="lws-modal" onclick="lwsCloseTrailerOutside(event)">',
        '<div id="lws-modal-box">',
          '<div id="lws-modal-header">',
            '<span id="lws-modal-label" style="color:#fff;font-weight:600;font-size:.9rem;">Tráiler oficial</span>',
            '<button onclick="lwsCloseTrailer()" style="background:none;border:none;color:#8a8a8a;font-size:1.3rem;cursor:pointer;line-height:1;padding:0;">✕</button>',
          '</div>',
          '<iframe id="lws-modal-iframe" src="" allowfullscreen allow="autoplay; encrypted-media"></iframe>',
        '</div>',
      '</div>',
      '<div id="lws-toast"><div id="lws-toast-inner">',
        '<span id="lws-toast-icon" style="font-weight:700;color:#00b4ff;font-size:.9rem;">OK</span>',
        '<span id="lws-toast-msg">Listo</span>',
      '</div></div>',
    ].join('');

    var scripts = document.getElementsByTagName('script');
    var configScript = null;
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].textContent.indexOf('LW_SLUG') !== -1) { configScript = scripts[i]; break; }
    }
    var container = document.createElement('div');
    container.innerHTML = html;
    if (configScript && configScript.parentNode) {
      configScript.parentNode.insertBefore(container, configScript.nextSibling);
    } else {
      document.body.appendChild(container);
    }
  })();

  /* ─────────────────────────────────────────────────────────────
     CLAVE DE API
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
  function extractTmdbId(input) {
    if (!input) return null;
    var s = String(input).trim();
    if (/^\d+$/.test(s)) return parseInt(s);
    var m = s.match(/\/(tv|movie)\/(\d+)/);
    return m ? parseInt(m[2]) : null;
  }
  function extractMalId(input) {
    if (!input) return null;
    var s = String(input).trim();
    if (/^\d+$/.test(s)) return parseInt(s);
    var m = s.match(/\/anime\/(\d+)/);
    return m ? parseInt(m[1]) : null;
  }
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function fmtVotes(n) { n=parseInt(String(n).replace(/,/g,'')); if(isNaN(n)||n===0) return ''; if(n>=1000000) return (n/1000000).toFixed(1)+'M'; if(n>=1000) return Math.round(n/1000)+'k'; return String(n); }
  function apiFetch(url) { return fetch(url).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); }); }
  function hideLoading() { var el=document.getElementById('lws-loading'); if(el) el.style.display='none'; }
  function showWidget() { document.getElementById('lws-widget').style.display='block'; try{window.stop();}catch(e){} }
  function showError(msg) { hideLoading(); var w=document.getElementById('lws-widget'); w.style.display='block'; w.innerHTML='<div class="lws-error">⚠️ '+msg+'</div>'; }
  function lwsToast(icon, msg) { clearTimeout(toastTimer); document.getElementById('lws-toast-icon').textContent=icon; document.getElementById('lws-toast-msg').textContent=msg; document.getElementById('lws-toast').classList.add('lws-show'); toastTimer=setTimeout(function(){ document.getElementById('lws-toast').classList.remove('lws-show'); },2800); }

  function buildEpUrl(season, epNum) {
    var base=(LW_BLOG_URL||window.location.origin).replace(/\/+$/,'');
    var date=(LW_DATE||'').replace(/\/+$/,'');
    return date ? base+'/'+date+'/'+LW_SLUG+'-'+season+'x'+epNum+'.html' : base+'/'+LW_SLUG+'-'+season+'x'+epNum+'.html';
  }

  /* ─────────────────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────────────────── */
  function init() {
    var malId  = extractMalId(LW_MAL_ID)   || 0;
    var tmdbId = extractTmdbId(LW_TMDB_ID) || 0;
    if (!malId && !tmdbId) { showError('Define LW_MAL_ID y/o LW_TMDB_ID en la Sección 1.'); hideLoading(); return; }
    tmdbShowId = tmdbId;

    var jikanP = malId
      ? Promise.all([apiFetch('https://api.jikan.moe/v4/anime/'+malId), apiFetch('https://api.jikan.moe/v4/anime/'+malId+'/videos')])
          .catch(function(){ return new Promise(function(res){ setTimeout(function(){ Promise.all([apiFetch('https://api.jikan.moe/v4/anime/'+malId),apiFetch('https://api.jikan.moe/v4/anime/'+malId+'/videos')]).then(res).catch(function(){ res([null,null]); }); },1200); }); })
      : Promise.resolve([null,null]);

    var tmdbP = tmdbId
      ? Promise.all([
          apiFetch('https://api.themoviedb.org/3/tv/'+tmdbId+'?api_key='+TMDB_KEY+'&language=es-MX'),
          apiFetch('https://api.themoviedb.org/3/tv/'+tmdbId+'/videos?api_key='+TMDB_KEY+'&language=es-MX'),
          apiFetch('https://api.themoviedb.org/3/tv/'+tmdbId+'/videos?api_key='+TMDB_KEY+'&language=en-US'),
          apiFetch('https://api.themoviedb.org/3/tv/'+tmdbId+'/content_ratings?api_key='+TMDB_KEY),
        ]).catch(function(){ return [null,null,null,null]; })
      : Promise.resolve([null,null,null,null]);

    Promise.all([jikanP, tmdbP]).then(function(results){
      var jikan     = (results[0][0]&&results[0][0].data) ? results[0][0].data : null;
      var jikanVids = (results[0][1]&&results[0][1].data) ? results[0][1].data : null;
      var tmdb      = results[1][0];
      var videosEs  = results[1][1];
      var videosEn  = results[1][2];
      var ratings   = results[1][3];
      var data = buildData(jikan, jikanVids, tmdb, videosEs, videosEn, ratings);
      renderWidget(data);

      if (tmdbId && tmdb && tmdb.seasons) {
        tmdbSeasons = tmdb.seasons.filter(function(s){ return s.season_number>0; }).map(function(s){ return s.season_number; });
        if (tmdbSeasons.length > 0) {
          buildSeasonTabs(tmdbSeasons);
          loadSeasonThen(tmdbSeasons[0], function(){ hideLoading(); showWidget(); });
          return;
        }
      }
      hideLoading(); showWidget();
    }).catch(function(err){
      console.error(err);
      showError('No se pudo conectar con las APIs. Verifica los IDs en la Sección 1.');
      hideLoading();
    });
  }

  /* ─────────────────────────────────────────────────────────────
     BUILD DATA
  ───────────────────────────────────────────────────────────── */
  function buildData(jikan, jikanVids, tmdb, videosEs, videosEn, contentRatings) {
    var titleEs='', titleRomanized='', titleOriginal='';
    if (jikan) {
      titleRomanized=jikan.title||''; titleOriginal=jikan.title_japanese||'';
      if (jikan.titles){ var t=jikan.titles.find(function(t){ return t.type==='Spanish'||/[áéíóúñ]/i.test(t.title||''); }); if(t) titleEs=t.title; }
      if (!titleEs) titleEs=jikan.title_english||titleRomanized;
    }
    if (!titleEs&&tmdb) titleEs=tmdb.name||tmdb.original_name||'Sin título';
    if (!titleRomanized&&tmdb) titleRomanized=tmdb.original_name||'';
    var mainTitle=titleEs||titleRomanized||'Sin título';

    var overview='Sin sinopsis disponible.';
    if (tmdb&&tmdb.overview&&tmdb.overview.trim()) overview=tmdb.overview;
    else if (jikan&&jikan.synopsis) overview=jikan.synopsis;

    var poster='';
    if (jikan&&jikan.images&&jikan.images.jpg) poster=jikan.images.jpg.large_image_url||jikan.images.jpg.image_url||'';
    if (!poster&&tmdb&&tmdb.poster_path) poster='https://image.tmdb.org/t/p/w500'+tmdb.poster_path;
    var backdrop=(tmdb&&tmdb.backdrop_path)?'https://image.tmdb.org/t/p/original'+tmdb.backdrop_path:poster;

    var genreMap={'Action':'Acción','Adventure':'Aventura','Comedy':'Comedia','Drama':'Drama','Fantasy':'Fantasía','Horror':'Terror','Mystery':'Misterio','Romance':'Romance','Sci-Fi':'Ciencia ficción','Science Fiction':'Ciencia ficción','Slice of Life':'Vida cotidiana','Sports':'Deportes','Supernatural':'Sobrenatural','Thriller':'Suspenso','Music':'Música','Psychological':'Psicológico','Mecha':'Mecha','Isekai':'Isekai','Historical':'Histórico','Military':'Militar','School':'Escolar','Magic':'Magia','Animation':'Animación'};
    var genres=jikan?(jikan.genres||[]).concat(jikan.themes||[]).map(function(g){ return genreMap[g.name]||g.name; }):(tmdb&&tmdb.genres?tmdb.genres.map(function(g){ return genreMap[g.name]||g.name; }):[]);

    var ratings=[];
    if (tmdb&&tmdb.vote_average>0) ratings.push({source:'TMDB',icon:'TMDB',score:tmdb.vote_average.toFixed(1)+' / 10',votes:tmdb.vote_count?fmtVotes(tmdb.vote_count):'',pct:(tmdb.vote_average/10)*100,color:'#01d277'});
    if (jikan&&jikan.score>0) ratings.push({source:'MyAnimeList',icon:'MAL',score:jikan.score.toFixed(2)+' / 10',votes:jikan.scored_by?fmtVotes(jikan.scored_by):'',pct:(jikan.score/10)*100,color:'#2e51a2'});

    var trailer=null;
    if (LW_TRAILER_YT){ trailer={key:LW_TRAILER_YT,name:'Tráiler oficial'}; }
    else {
      var vids=[].concat((videosEs&&videosEs.results)||[],(videosEn&&videosEn.results)||[]);
      if (jikanVids&&jikanVids.promo&&jikanVids.promo.length&&jikanVids.promo[0].trailer&&jikanVids.promo[0].trailer.youtube_id) vids.unshift({key:jikanVids.promo[0].trailer.youtube_id,type:'Trailer',site:'YouTube',name:jikanVids.promo[0].title||'Tráiler oficial'});
      trailer=vids.find(function(v){ return v.type==='Trailer'&&v.site==='YouTube'; })||vids.find(function(v){ return v.type==='Teaser'&&v.site==='YouTube'; })||(vids.length?vids[0]:null);
    }

    var year='',release='N/D';
    var dateStr=(tmdb&&tmdb.first_air_date)||(jikan&&jikan.aired&&jikan.aired.from);
    if (dateStr){ year=dateStr.slice(0,4); try{ release=new Date(dateStr).toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'}); }catch(e){ release=dateStr; } }

    var statusMap={'Finished Airing':'Finalizado','Currently Airing':'En emisión','Not yet aired':'Próximamente','Ended':'Finalizado','Returning Series':'En emisión','In Production':'En producción','Planned':'Planeado','Canceled':'Cancelado'};
    var status='';
    if (tmdb&&tmdb.status) status=statusMap[tmdb.status]||tmdb.status;
    if (!status&&jikan&&jikan.status) status=statusMap[jikan.status]||jikan.status;

    var studios=jikan?(jikan.studios||[]).map(function(s){ return s.name; }).join(', '):(tmdb&&tmdb.networks?tmdb.networks.slice(0,2).map(function(n){ return n.name; }).join(', '):'');
    if (!studios) studios='N/D';

    var runtime='N/D';
    if (jikan&&jikan.duration) runtime=jikan.duration.replace(/ per ep\.?/i,'').trim();
    else if (tmdb&&tmdb.episode_run_time&&tmdb.episode_run_time.length) runtime=tmdb.episode_run_time[0]+' min';

    var ageRating='';
    if (contentRatings&&contentRatings.results){ var cr=contentRatings.results.find(function(r){ return r.iso_3166_1==='MX'; })||contentRatings.results.find(function(r){ return r.iso_3166_1==='US'; }); if(cr&&cr.rating) ageRating=cr.rating; }
    if (!ageRating&&jikan&&jikan.rating) ageRating=jikan.rating;

    var totalEps=(tmdb&&tmdb.number_of_episodes)||(jikan&&jikan.episodes)||null;
    var totalSeasons=(tmdb&&tmdb.seasons)?tmdb.seasons.filter(function(s){ return s.season_number>0; }).length:null;

    return { title:mainTitle,romanizedTitle:(titleRomanized&&titleRomanized!==mainTitle)?titleRomanized:'',originalTitle:titleOriginal,year,overview,genres,poster,backdrop,runtime,ageRating,studio:studios,ratings,trailer,releaseDate:release,status,totalEps,totalSeasons,malId:(jikan&&jikan.mal_id)?jikan.mal_id:0 };
  }

  /* ─────────────────────────────────────────────────────────────
     RENDER WIDGET
  ───────────────────────────────────────────────────────────── */
  function renderWidget(d) {
    var blogBase=(LW_BLOG_URL||window.location.origin).replace(/\/+$/,'');
    if (d.backdrop||d.poster) document.getElementById('lws-hero-bg').style.backgroundImage="url('"+(d.backdrop||d.poster)+"')";
    var heroMain=d.romanizedTitle||d.title;
    document.getElementById('lws-title').innerHTML=esc(heroMain)+(d.year?' <span style="color:#666;font-weight:300;font-size:.55em;">('+d.year+')</span>':'');
    var extHtml='';
    if (d.originalTitle&&d.originalTitle!==heroMain) extHtml='<p style="color:#888;font-size:.82rem;margin:0;"><span style="color:#555;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-right:6px;">Original</span>'+esc(d.originalTitle)+'</p>';
    document.getElementById('lws-titles-extra').innerHTML=extHtml;

    var sep='<span style="width:1px;height:14px;background:#2a2a2a;display:inline-block;"></span>';
    var meta=[];
    var tmdbR=d.ratings.find(function(r){ return r.source==='TMDB'; });
    var malR=d.ratings.find(function(r){ return r.source==='MyAnimeList'; });
    if (tmdbR) meta.push('<span style="color:#01d277;font-weight:700;font-size:.9rem;">★ '+tmdbR.score.split(' ')[0]+'</span>');
    if (malR) meta.push(sep+'<span class="lws-badge-mal">MAL</span><span style="font-weight:700;font-size:.88rem;">'+malR.score.split(' ')[0]+(malR.votes?' <span style="color:#666;font-size:.78rem;">('+malR.votes+')</span>':'')+'</span>');
    if (d.ageRating) meta.push(sep+'<span class="lws-badge-age">'+esc(d.ageRating)+'</span>');
    if (d.runtime!=='N/D') meta.push(sep+'<span style="color:#8a8a8a;font-size:.85rem;">⏱ '+esc(d.runtime)+'</span>');
    if (d.status){ var stC=d.status==='En emisión'?'background:rgba(0,180,255,.15);color:#00b4ff;border:1px solid rgba(0,180,255,.3)':d.status==='Finalizado'?'background:rgba(255,255,255,.06);color:#888;border:1px solid #2a2a2a':'background:rgba(255,102,0,.15);color:#ff9944;border:1px solid rgba(255,102,0,.3)'; meta.push(sep+'<span style="font-size:.75rem;padding:2px 8px;border-radius:4px;font-weight:700;'+stC+'">'+esc(d.status)+'</span>'); }
    document.getElementById('lws-meta-row').innerHTML=meta.join('');
    document.getElementById('lws-genres-row').innerHTML=d.genres.map(function(g){ return '<a href="'+blogBase+'/search/label/'+encodeURIComponent(g)+'" class="lws-genre-pill" rel="tag">'+esc(g)+'</a>'; }).join('');

    if (d.poster) document.getElementById('lws-poster').src=d.poster;
    var panelMain=d.romanizedTitle||d.title;
    document.getElementById('lws-panel-title').textContent=panelMain;
    var sub='<div style="font-size:.7rem;color:#666;margin-bottom:3px;"><span style="color:#444;font-weight:700;text-transform:uppercase;font-size:.6rem;letter-spacing:.1em;margin-right:4px;">ROM</span>'+esc(panelMain)+'</div>';
    if (d.title&&d.title!==panelMain) sub+='<div style="font-size:.7rem;color:#666;margin-bottom:3px;"><span style="color:#444;font-weight:700;text-transform:uppercase;font-size:.6rem;letter-spacing:.1em;margin-right:4px;">ES</span>'+esc(d.title)+'</div>';
    if (d.originalTitle&&d.originalTitle!==panelMain&&d.originalTitle!==d.title) sub+='<div style="font-size:.7rem;color:#555;"><span style="color:#444;font-weight:700;text-transform:uppercase;font-size:.6rem;letter-spacing:.1em;margin-right:4px;">ORI</span>'+esc(d.originalTitle)+'</div>';
    document.getElementById('lws-panel-original').innerHTML=sub;
    document.getElementById('lws-panel-genres').innerHTML=d.genres.slice(0,4).map(function(g){ return '<a href="'+blogBase+'/search/label/'+encodeURIComponent(g)+'" class="lws-genre-chip-link" rel="tag">'+esc(g)+'</a>'; }).join('');
    document.getElementById('lws-director').textContent=d.studio;
    renderRatings(d.ratings);

    var rows=[['Año',d.year||'N/D'],['Estreno',d.releaseDate],['Duración ep.',d.runtime],['Estudio',d.studio]];
    if (d.ageRating) rows.push(['Clasificación',d.ageRating]);
    if (d.totalSeasons) rows.push(['Temporadas',String(d.totalSeasons)]);
    if (d.totalEps) rows.push(['Episodios',String(d.totalEps)]);
    if (d.status) rows.push(['Estado',d.status]);
    if (d.malId) rows.push(['MAL','<a href="https://myanimelist.net/anime/'+d.malId+'" target="_blank" rel="noopener" style="color:#2e51a2;">Ver en MAL ↗</a>']);
    if (tmdbShowId) rows.push(['TMDB','<a href="https://www.themoviedb.org/tv/'+tmdbShowId+'" target="_blank" rel="noopener" style="color:#01d277;">Ver en TMDB ↗</a>']);
    document.getElementById('lws-ficha').innerHTML=rows.map(function(r){ return '<div style="display:flex;justify-content:space-between;gap:8px;"><span style="color:#666;">'+r[0]+'</span><span style="color:#e0e0e0;font-weight:500;text-align:right;">'+r[1]+'</span></div>'; }).join('');

    var synEl=document.getElementById('lws-synopsis');
    synEl.textContent=d.overview;
    if (d.overview.length>220) document.getElementById('lws-syn-btn').style.display='inline';

    if (d.trailer&&d.trailer.key){
      lwsTrailerKey=d.trailer.key; lwsTrailerTitle=d.title;
      document.getElementById('lws-trailer-section').style.display='block';
      document.getElementById('lws-trailer-img').src='https://img.youtube.com/vi/'+d.trailer.key+'/hqdefault.jpg';
      document.getElementById('lws-trailer-label').textContent=d.trailer.name||'Tráiler oficial';
      document.getElementById('lws-modal-label').textContent=d.title+' - '+(d.trailer.name||'Tráiler');
    }
    setTimeout(function(){ document.querySelectorAll('.lws-rbar-fill[data-pct]').forEach(function(b){ b.style.width=Math.min(parseFloat(b.getAttribute('data-pct')),100)+'%'; }); },350);
    injectSEO(d);
  }

  function renderRatings(ratings) {
    var el=document.getElementById('lws-ratings');
    if (!ratings.length){ el.innerHTML='<p style="color:#555;font-size:.8rem;">Sin calificaciones disponibles.</p>'; return; }
    el.innerHTML=ratings.map(function(r){ var badge=r.icon==='MAL'?'<span class="lws-badge-mal">MAL</span>':'<span class="lws-badge-tmdb">TMDB</span>'; return '<div><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;"><div style="display:flex;align-items:center;gap:8px;">'+badge+'<span style="font-weight:700;color:#fff;font-size:.88rem;">'+esc(r.score)+(r.votes?' <span style="color:#666;font-size:.75rem;">('+esc(r.votes)+')</span>':'')+'</span></div><span style="color:#555;font-size:.75rem;">'+esc(r.source)+'</span></div><div class="lws-rbar-bg"><div class="lws-rbar-fill" data-pct="'+r.pct+'" style="background:'+r.color+';"></div></div></div>'; }).join('');
  }

  /* ─────────────────────────────────────────────────────────────
     TEMPORADAS
  ───────────────────────────────────────────────────────────── */
  function buildSeasonTabs(seasons) {
    document.getElementById('lws-season-tabs').innerHTML=seasons.map(function(sn,i){ return '<button class="lws-season-btn '+(i===0?'active':'')+'" onclick="lwsSelectSeason(this,'+sn+')">T'+sn+'</button>'; }).join('');
  }

  window.lwsSelectSeason = function(el, seasonNum) {
    activeSeason=seasonNum;
    document.querySelectorAll('.lws-season-btn').forEach(function(b){ b.classList.remove('active'); });
    el.classList.add('active');
    document.getElementById('lws-ep-search').value='';
    document.getElementById('lws-ep-empty').style.display='none';
    loadSeason(seasonNum);
  };

  function loadSeason(seasonNum) { loadSeasonThen(seasonNum, null); }

  function loadSeasonThen(seasonNum, onReady) {
    activeSeason=seasonNum;
    var epList=document.getElementById('lws-ep-list');
    epList.innerHTML=[1,2,3,4,5].map(function(){ return '<div style="display:flex;gap:12px;padding:10px;border-radius:10px;border:1px solid #1e1e1e;background:#111;"><div class="lws-skel" style="width:112px;min-width:112px;aspect-ratio:16/9;border-radius:6px;"></div><div style="flex:1;display:flex;flex-direction:column;gap:8px;padding:4px 0;"><div class="lws-skel" style="height:14px;width:60%;"></div><div class="lws-skel" style="height:10px;width:30%;"></div><div class="lws-skel" style="height:10px;width:90%;"></div></div></div>'; }).join('');
    if (episodesCache[seasonNum]){ renderEpisodes(episodesCache[seasonNum],seasonNum); if(onReady) onReady(); return; }
    apiFetch('https://api.themoviedb.org/3/tv/'+tmdbShowId+'/season/'+seasonNum+'?api_key='+TMDB_KEY+'&language=es-MX')
      .then(function(season){ episodesCache[seasonNum]=season.episodes||[]; renderEpisodes(episodesCache[seasonNum],seasonNum); if(onReady) onReady(); })
      .catch(function(){ epList.innerHTML='<p style="color:#555;font-size:.85rem;text-align:center;padding:20px 0;">No se pudieron cargar los episodios.</p>'; if(onReady) onReady(); });
  }

  function renderEpisodes(episodes, seasonNum, filterText) {
    var epList=document.getElementById('lws-ep-list');
    var sn=seasonNum||activeSeason;
    var today=new Date();
    if (!episodes.length){ epList.innerHTML='<p style="color:#555;font-size:.85rem;text-align:center;padding:20px 0;">Sin episodios disponibles.</p>'; return; }
    var list=episodes.slice();
    if (sortDesc) list=list.reverse();
    var query=(filterText||'').trim().toLowerCase();
    if (query) list=list.filter(function(ep){ return (ep.name||'').toLowerCase().indexOf(query)>=0||String(ep.episode_number).indexOf(query)>=0; });
    var emptyEl=document.getElementById('lws-ep-empty');
    if (!list.length){ epList.innerHTML=''; document.getElementById('lws-ep-empty-q').textContent=query; emptyEl.style.display='block'; return; }
    emptyEl.style.display='none';
    epList.innerHTML=list.map(function(ep){
      var epNum=ep.episode_number, title=ep.name||('Episodio '+epNum), overview=ep.overview||'';
      var airDate=ep.air_date?new Date(ep.air_date):null, isUnlocked=airDate?(airDate<=today):false;
      var thumb=ep.still_path?'https://image.tmdb.org/t/p/w300'+ep.still_path:'';
      var dateStr=''; if(airDate){ try{ dateStr=airDate.toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'}); }catch(e){ dateStr=ep.air_date; } }
      var epUrl=buildEpUrl(sn,epNum), labelSxE=sn+'x'+epNum;
      var thumbHtml='<div class="lws-ep-thumb">'+(thumb?'<img src="'+thumb+'" alt="'+esc(title)+'" loading="lazy">':'<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#333;font-size:1.4rem;">▶</div>')+'<span class="lws-ep-num">'+esc(labelSxE)+'</span>'+(!isUnlocked?'<div class="lws-ep-lock">🔒</div>':'')+'</div>';
      var infoHtml='<div class="lws-ep-info"><div class="lws-ep-title">'+esc(title)+'</div>'+(dateStr?'<div class="lws-ep-date">📅 '+dateStr+'</div>':'')+(overview&&isUnlocked?'<div class="lws-ep-overview">'+esc(overview)+'</div>':'')+(!isUnlocked?'<div class="lws-ep-date" style="color:#333;font-size:.72rem;">🔒 Próximamente</div>':'')+'</div>';
      return isUnlocked?'<a href="'+epUrl+'" class="lws-ep-card">'+thumbHtml+infoHtml+'</a>':'<div class="lws-ep-card locked">'+thumbHtml+infoHtml+'</div>';
    }).join('');
  }

  /* ─────────────────────────────────────────────────────────────
     INTERACTIVIDAD
  ───────────────────────────────────────────────────────────── */
  window.lwsExpandSyn = function(){ var el=document.getElementById('lws-synopsis'); el.style['-webkit-line-clamp']='unset'; el.style.display='block'; document.getElementById('lws-syn-btn').style.display='none'; };
  window.lwsFilterEpisodes = function(){ var query=document.getElementById('lws-ep-search').value; renderEpisodes(episodesCache[activeSeason]||[],activeSeason,query); };
  window.lwsToggleSort = function(btn){ sortDesc=!sortDesc; btn.classList.toggle('desc',sortDesc); document.getElementById('lws-sort-label').textContent=sortDesc?'N-1':'1-N'; renderEpisodes(episodesCache[activeSeason]||[],activeSeason,document.getElementById('lws-ep-search').value); };
  window.lwsOpenTrailer = function(id){ if(!id) return; document.getElementById('lws-modal-iframe').src='https://www.youtube.com/embed/'+id+'?autoplay=1'; document.getElementById('lws-modal').classList.add('lws-active'); document.body.style.overflow='hidden'; };
  window.lwsCloseTrailer = function(){ document.getElementById('lws-modal').classList.remove('lws-active'); document.getElementById('lws-modal-iframe').src=''; document.body.style.overflow=''; };
  window.lwsCloseTrailerOutside = function(e){ if(e.target===document.getElementById('lws-modal')) window.lwsCloseTrailer(); };
  window.lwsShare = function(net){ var url=encodeURIComponent(window.location.href),title=encodeURIComponent(document.title),links={twitter:'https://twitter.com/intent/tweet?text='+title+'&url='+url,facebook:'https://www.facebook.com/sharer/sharer.php?u='+url}; if(links[net]) window.open(links[net],'_blank','width=600,height=400'); lwsToast('OK','Compartiendo en '+net+'…'); };
  window.lwsCopyLink = function(){ try{navigator.clipboard.writeText(window.location.href);}catch(e){} lwsToast('OK','Enlace copiado'); };
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') window.lwsCloseTrailer(); });

  /* ─────────────────────────────────────────────────────────────
     SEO
  ───────────────────────────────────────────────────────────── */
  function injectSEO(d) {
    var parts=[d.title]; if(d.romanizedTitle&&d.romanizedTitle!==d.title) parts.push(d.romanizedTitle); if(d.originalTitle&&d.originalTitle!==d.title) parts.push(d.originalTitle);
    var seoTitle=parts.join(' / ')+(d.year?' ('+d.year+')':'')+' - Ver Online Latino';
    var seoDesc=(d.overview||'').slice(0,160), seoImg=d.poster||d.backdrop||'', seoUrl=window.location.href;
    var keywords=parts.concat(d.genres||[]).concat(['ver online','anime','serie','latino','subtitulado',d.year]).filter(Boolean).join(', ');
    try{document.title=seoTitle;}catch(e){}
    function setName(n,v){ var el=document.querySelector('meta[name="'+n+'"]'); if(!el){el=document.createElement('meta');el.setAttribute('name',n);document.head.appendChild(el);} el.setAttribute('content',v); }
    function setProp(p,v){ var el=document.querySelector('meta[property="'+p+'"]'); if(!el){el=document.createElement('meta');el.setAttribute('property',p);document.head.appendChild(el);} el.setAttribute('content',v); }
    setName('description',seoDesc); setName('keywords',keywords); setName('robots','index, follow');
    setProp('og:title',seoTitle); setProp('og:description',seoDesc); setProp('og:image',seoImg); setProp('og:url',seoUrl); setProp('og:type','video.tv_show'); setProp('og:locale','es_MX');
    setName('twitter:card','summary_large_image'); setName('twitter:title',seoTitle); setName('twitter:description',seoDesc); setName('twitter:image',seoImg);
    var canon=document.querySelector('link[rel="canonical"]'); if(!canon){canon=document.createElement('link');canon.setAttribute('rel','canonical');document.head.appendChild(canon);} canon.setAttribute('href',seoUrl);
    var bestR=(d.ratings||[]).find(function(r){ return r.source==='MyAnimeList'; })||(d.ratings||[]).find(function(r){ return r.source==='TMDB'; });
    var jsonLd={'@context':'https://schema.org','@type':'TVSeries','name':d.title,'alternateName':[d.romanizedTitle,d.originalTitle].filter(Boolean),'description':d.overview||'','image':seoImg,'startDate':d.year||'','genre':d.genres||[],'url':seoUrl,'inLanguage':'es','aggregateRating':bestR?{'@type':'AggregateRating','ratingValue':bestR.score.split(' ')[0],'bestRating':'10','ratingCount':bestR.votes?bestR.votes.replace(/\D/g,''):undefined}:undefined};
    var ld=document.getElementById('lws-jsonld')||(function(){ var s=document.createElement('script');s.type='application/ld+json';s.id='lws-jsonld';document.head.appendChild(s);return s; })();
    ld.textContent=JSON.stringify(jsonLd,function(k,v){ return v===undefined?undefined:v; },2);
  }

  if (document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',init); } else { init(); }

})();
