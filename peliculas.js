(function () {
  'use strict';

  /* ── Inyecta el HTML del widget en la página ── */
  (function injectHTML() {
    var html = [
      '<div id="lw-seo-container" style="display:none;" aria-hidden="true"></div>',
      '<div id="lw-loading">',
        '<div class="lw-spinner"></div>',
        '<p id="lw-loading-msg" style="color:#555;font-size:.85rem;">Importando datos…</p>',
      '</div>',
      '<div id="lw-widget" style="display:none;">',
        '<div id="lw-hero-wrap">',
          '<div id="lw-hero-bg"></div>',
          '<div id="lw-hero-overlay"></div>',
          '<div id="lw-hero-bottom"></div>',
          '<div id="lw-hero-content">',
            '<h1 id="lw-title" class="lw-fade"></h1>',
            '<div id="lw-titles-extra" class="lw-fade lw-d1"></div>',
            '<div id="lw-meta-row" class="lw-fade lw-d2"></div>',
            '<div id="lw-genres-row" class="lw-fade lw-d3"></div>',
          '</div>',
        '</div>',
        '<div id="lw-main-grid">',
          '<div class="lw-col-left">',
            '<div class="lw-player-header">',
              '<span class="lw-sec-title">Ver Ahora</span>',
              '<div class="lw-lang-wrap">',
                '<span id="lw-lang-flag">🌐</span>',
                '<div style="position:relative;">',
                  '<select id="lw-lang-select" class="lw-lang-select" onchange="lwChangeLang(this)"></select>',
                  '<svg class="lw-select-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M19 9l-7 7-7-7"/></svg>',
                '</div>',
              '</div>',
            '</div>',
            '<div id="lw-server-tabs"></div>',
            '<div id="lw-player-wrap">',
              '<div id="lw-player-poster"></div>',
              '<div id="lw-play-overlay" onclick="lwStartPlayer()">',
                '<div class="lw-play-btn">',
                  '<svg style="width:30px;height:30px;margin-left:4px;" viewBox="0 0 20 20" fill="black">',
                    '<path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>',
                  '</svg>',
                '</div>',
                '<span id="lw-play-label" style="color:rgba(255,255,255,.6);font-size:.85rem;">Reproducir</span>',
              '</div>',
            '</div>',
            '<p class="lw-quality-note">',
              '<svg style="width:14px;height:14px;color:#00b4ff;flex-shrink:0;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>',
              'Si el reproductor no carga, prueba con otro servidor. Calidad: <span style="color:#e0e0e0;font-weight:600;">1080p HD</span>',
            '</p>',
            '<div class="lw-section">',
              '<span class="lw-sec-title">Sinopsis</span>',
              '<p id="lw-synopsis" class="lw-synopsis-text"></p>',
              '<button id="lw-syn-btn" onclick="lwExpandSyn()" class="lw-syn-btn" style="display:none;">Leer más ▾</button>',
            '</div>',
            '<div id="lw-trailer-section" style="display:none;" class="lw-section">',
              '<span class="lw-sec-title">Tráiler</span>',
              '<div id="lw-trailer-thumb" style="position:relative;border-radius:12px;overflow:hidden;cursor:pointer;" onclick="lwOpenTrailer(trailerYtId,\'\')">',
                '<div style="aspect-ratio:16/9;">',
                  '<img id="lw-trailer-img" src="" alt="Tráiler" style="width:100%;height:100%;object-fit:cover;transition:transform .5s;">',
                '</div>',
                '<div style="position:absolute;inset:0;background:rgba(0,0,0,.4);"></div>',
                '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">',
                  '<div style="width:64px;height:64px;background:rgba(255,255,255,.9);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 32px rgba(0,0,0,.6);">',
                    '<svg style="width:26px;height:26px;margin-left:4px;" viewBox="0 0 20 20" fill="black"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>',
                  '</div>',
                '</div>',
                '<div style="position:absolute;bottom:12px;left:16px;">',
                  '<div id="lw-trailer-label" style="color:#fff;font-size:.85rem;font-weight:600;text-shadow:0 1px 8px rgba(0,0,0,.8);">Tráiler oficial</div>',
                '</div>',
              '</div>',
            '</div>',
          '</div>',
          '<div class="lw-col-right">',
            '<div id="lw-info-panel">',
              '<div class="lw-info-section lw-info-top">',
                '<div class="lw-poster-thumb">',
                  '<img id="lw-poster" src="" alt="Poster" onerror="this.src=\'https://via.placeholder.com/150x225/1a1a1a/555?text=N/A\'">',
                '</div>',
                '<div style="min-width:0;">',
                  '<div class="lw-info-label">Información</div>',
                  '<div id="lw-panel-title" class="lw-panel-title"></div>',
                  '<div id="lw-panel-original" class="lw-panel-original"></div>',
                  '<div id="lw-panel-genres"></div>',
                '</div>',
              '</div>',
              '<div class="lw-info-section">',
                '<div class="lw-info-label">Director</div>',
                '<span id="lw-director" style="color:#00b4ff;font-weight:600;font-size:.88rem;">…</span>',
              '</div>',
              '<div class="lw-info-section">',
                '<div class="lw-info-label">Calificación</div>',
                '<div id="lw-ratings"></div>',
              '</div>',
              '<div class="lw-info-section">',
                '<div class="lw-info-label">Ficha técnica</div>',
                '<div id="lw-ficha"></div>',
              '</div>',
              '<div class="lw-info-section" id="lw-trailer-panel-section" style="display:none;">',
                '<div class="lw-info-label">Tráiler oficial</div>',
                '<div id="lw-trailer-panel" onclick="lwOpenTrailer(trailerYtId,\'\')">',
                  '<img id="lw-trailer-panel-img" src="" alt="Trailer">',
                  '<div id="lw-trailer-panel-overlay">',
                    '<div id="lw-trailer-play-btn">',
                      '<svg style="width:20px;height:20px;margin-left:3px;" viewBox="0 0 20 20" fill="#000"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>',
                    '</div>',
                  '</div>',
                  '<div style="position:absolute;bottom:8px;left:10px;">',
                    '<span id="lw-trailer-panel-label" style="color:#fff;font-size:.75rem;font-weight:600;text-shadow:0 1px 6px rgba(0,0,0,.9);background:rgba(0,0,0,.4);padding:2px 7px;border-radius:4px;">Tráiler oficial</span>',
                  '</div>',
                '</div>',
              '</div>',
              '<div class="lw-info-section">',
                '<div class="lw-info-label">Compartir</div>',
                '<div style="display:flex;gap:8px;">',
                  '<button class="lw-share-btn" onclick="lwShare(\'twitter\')"><svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>Twitter</button>',
                  '<button class="lw-share-btn" onclick="lwShare(\'facebook\')"><svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>Facebook</button>',
                  '<button class="lw-share-btn" onclick="lwCopyLink()"><svg style="width:14px;height:14px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>Copiar</button>',
                '</div>',
              '</div>',
            '</div>',
          '</div>',
        '</div>',
      '</div>',
      '<div id="lw-modal" onclick="lwCloseTrailerOutside(event)">',
        '<div id="lw-modal-box">',
          '<div id="lw-modal-header">',
            '<span id="lw-modal-label" style="color:#fff;font-weight:600;font-size:.9rem;">Tráiler oficial</span>',
            '<button onclick="lwCloseTrailer()" style="background:none;border:none;color:#8a8a8a;font-size:1.3rem;cursor:pointer;line-height:1;padding:0;">✕</button>',
          '</div>',
          '<iframe id="lw-modal-iframe" src="" allowfullscreen allow="autoplay; encrypted-media"></iframe>',
        '</div>',
      '</div>',
      '<div id="lw-toast"><div id="lw-toast-inner">',
        '<span id="lw-toast-icon" style="font-weight:700;color:#00b4ff;font-size:.9rem;">OK</span>',
        '<span id="lw-toast-msg">Listo</span>',
      '</div></div>',
    ].join('');

    /* Busca el script de configuración (Sección 1) e inserta el widget justo después */
    var scripts = document.getElementsByTagName('script');
    var configScript = null;
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].textContent.indexOf('LW_LANGS') !== -1) {
        configScript = scripts[i];
        break;
      }
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
  var trailerYtId   = '';

  /* ─────────────────────────────────────────────────────────────
     UTILIDADES
  ───────────────────────────────────────────────────────────── */
  function extractTmdbId(input) {
    if (!input) return null;
    var s = String(input).trim();
    if (/^\d+$/.test(s)) return parseInt(s);
    var m = s.match(/\/(movie|tv)\/(\d+)/);
    return m ? parseInt(m[2]) : null;
  }
  function extractMalId(input) {
    if (!input) return null;
    var s = String(input).trim();
    if (/^\d+$/.test(s)) return parseInt(s);
    var m = s.match(/\/anime\/(\d+)/);
    return m ? parseInt(m[1]) : null;
  }
  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function fmtVotes(n) {
    n = parseInt(String(n).replace(/,/g,''));
    if (isNaN(n)||n===0) return '';
    if (n>=1000000) return (n/1000000).toFixed(1)+'M';
    if (n>=1000) return Math.round(n/1000)+'k';
    return String(n);
  }
  function apiFetch(url) {
    return fetch(url).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); });
  }
  function hideLoading() { var el=document.getElementById('lw-loading'); if(el) el.style.display='none'; }
  function showWidget() { document.getElementById('lw-widget').style.display='block'; try{window.stop();}catch(e){} }
  function showError(msg) { hideLoading(); var w=document.getElementById('lw-widget'); w.style.display='block'; w.innerHTML='<div class="lw-error">⚠️ '+msg+'</div>'; }
  function lwToast(icon, msg) {
    clearTimeout(toastTimer);
    document.getElementById('lw-toast-icon').textContent = icon;
    document.getElementById('lw-toast-msg').textContent  = msg;
    document.getElementById('lw-toast').classList.add('lw-show');
    toastTimer = setTimeout(function(){ document.getElementById('lw-toast').classList.remove('lw-show'); }, 2800);
  }

  /* ─────────────────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────────────────── */
  function init() {
    var malId  = extractMalId(LW_MAL_ID)   || 0;
    var tmdbId = extractTmdbId(LW_MOVIE)   || 0;
    var blogBase = (LW_BLOG_URL || window.location.origin).replace(/\/+$/,'');
    var firstLang = LW_LANGS.find(function(l){ return l.enabled; });
    activeLangKey = firstLang ? firstLang.key : '';

    if (!malId && !tmdbId) { showError('Define LW_MAL_ID y/o LW_MOVIE en la Sección 1.'); hideLoading(); return; }

    var jikanP = malId
      ? apiFetch('https://api.jikan.moe/v4/anime/'+malId)
          .catch(function(){ return new Promise(function(res){ setTimeout(function(){ apiFetch('https://api.jikan.moe/v4/anime/'+malId).then(res).catch(function(){ res(null); }); },1200); }); })
      : Promise.resolve(null);

    var tmdbP = tmdbId
      ? Promise.all([
          apiFetch('https://api.themoviedb.org/3/movie/'+tmdbId+'?api_key='+TMDB_KEY+'&language=es-MX'),
          apiFetch('https://api.themoviedb.org/3/movie/'+tmdbId+'/videos?api_key='+TMDB_KEY+'&language=es-MX'),
          apiFetch('https://api.themoviedb.org/3/movie/'+tmdbId+'/videos?api_key='+TMDB_KEY+'&language=en-US'),
          apiFetch('https://api.themoviedb.org/3/movie/'+tmdbId+'/credits?api_key='+TMDB_KEY),
        ]).catch(function(){ return [null,null,null,null]; })
      : Promise.resolve([null,null,null,null]);

    Promise.all([jikanP, tmdbP]).then(function(results){
      var jikanRaw = results[0];
      var jikan    = jikanRaw && jikanRaw.data ? jikanRaw.data : jikanRaw;
      var tmdb     = results[1][0];
      var videosEs = results[1][1];
      var videosEn = results[1][2];
      var credits  = results[1][3];
      var data = buildData(jikan, tmdb, videosEs, videosEn, credits, blogBase, tmdbId);
      renderWidget(data, blogBase, tmdbId);
      renderServers();
      hideLoading();
      showWidget();
    }).catch(function(err){
      console.error(err);
      showError('No se pudo conectar con las APIs. Verifica los IDs en la Sección 1.');
      hideLoading();
    });
  }

  /* ─────────────────────────────────────────────────────────────
     BUILD DATA
  ───────────────────────────────────────────────────────────── */
  function buildData(jikan, tmdb, videosEs, videosEn, credits, blogBase, tmdbId) {
    var titleEs='', titleRomanized='', titleOriginal='';
    if (jikan) {
      titleRomanized = jikan.title || '';
      titleOriginal  = jikan.title_japanese || '';
      if (jikan.titles) { var t=jikan.titles.find(function(t){ return t.type==='Spanish'||/[áéíóúñ]/i.test(t.title||''); }); if(t) titleEs=t.title; }
      if (!titleEs) titleEs = jikan.title_english || titleRomanized;
    }
    if (!titleEs && tmdb) titleEs = tmdb.title || tmdb.original_title || 'Sin título';
    if (!titleRomanized && tmdb) titleRomanized = tmdb.original_title || '';
    var mainTitle = titleEs || titleRomanized || 'Sin título';

    var overview = 'Sin sinopsis disponible.';
    if (tmdb && tmdb.overview && tmdb.overview.trim()) overview = tmdb.overview;
    else if (jikan && jikan.synopsis) overview = jikan.synopsis;

    var poster = '';
    if (jikan && jikan.images && jikan.images.jpg) poster = jikan.images.jpg.large_image_url || jikan.images.jpg.image_url || '';
    if (!poster && tmdb && tmdb.poster_path) poster = 'https://image.tmdb.org/t/p/w500'+tmdb.poster_path;

    var backdrop = (tmdb && tmdb.backdrop_path) ? 'https://image.tmdb.org/t/p/original'+tmdb.backdrop_path : poster;

    var genreMap = {'Action':'Acción','Adventure':'Aventura','Comedy':'Comedia','Drama':'Drama','Fantasy':'Fantasía','Horror':'Terror','Mystery':'Misterio','Romance':'Romance','Sci-Fi':'Ciencia ficción','Science Fiction':'Ciencia ficción','Slice of Life':'Vida cotidiana','Sports':'Deportes','Supernatural':'Sobrenatural','Thriller':'Suspenso','Music':'Música','Psychological':'Psicológico','Mecha':'Mecha','Isekai':'Isekai','Historical':'Histórico','Military':'Militar','Animation':'Animación'};
    var genres = [];
    if (jikan) genres = (jikan.genres||[]).concat(jikan.themes||[]).map(function(g){ return genreMap[g.name]||g.name; });
    else if (tmdb && tmdb.genres) genres = tmdb.genres.map(function(g){ return genreMap[g.name]||g.name; });

    var ratings = [];
    if (tmdb && tmdb.vote_average>0) ratings.push({ source:'TMDB',icon:'TMDB',score:tmdb.vote_average.toFixed(1)+' / 10',votes:tmdb.vote_count?fmtVotes(tmdb.vote_count):'',pct:(tmdb.vote_average/10)*100,color:'#01d277' });
    if (jikan && jikan.score>0) ratings.push({ source:'MyAnimeList',icon:'MAL',score:jikan.score.toFixed(2)+' / 10',votes:jikan.scored_by?fmtVotes(jikan.scored_by):'',pct:(jikan.score/10)*100,color:'#2e51a2' });

    var trailer = null;
    if (LW_TRAILER_YT) { trailer = { key:LW_TRAILER_YT, name:'Tráiler oficial' }; }
    else {
      var vids = [].concat((videosEs&&videosEs.results)||[],(videosEn&&videosEn.results)||[]);
      if (jikan && jikan.trailer && jikan.trailer.youtube_id) vids.unshift({ key:jikan.trailer.youtube_id, type:'Trailer', site:'YouTube', name:'Tráiler oficial' });
      trailer = vids.find(function(v){ return v.type==='Trailer'&&v.site==='YouTube'; })
             || vids.find(function(v){ return v.type==='Teaser' &&v.site==='YouTube'; })
             || (vids.length?vids[0]:null);
    }

    var year='', release='N/D';
    var dateStr = (tmdb&&tmdb.release_date)||(jikan&&jikan.aired&&jikan.aired.from);
    if (dateStr) { year=dateStr.slice(0,4); try{ release=new Date(dateStr).toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'}); }catch(e){ release=dateStr; } }

    var director='N/D';
    if (credits && credits.crew) { var d=credits.crew.find(function(c){ return c.job==='Director'; }); if(d) director=d.name; }
    if (director==='N/D' && jikan && jikan.studios && jikan.studios.length) director=jikan.studios[0].name;

    var runtime='N/D';
    if (tmdb&&tmdb.runtime) runtime=tmdb.runtime+' min';
    else if (jikan&&jikan.duration) runtime=jikan.duration.replace(/ per ep\.?/i,'').trim();

    var ageRating='';
    if (tmdb&&tmdb.adult) ageRating='R';
    if (!ageRating&&jikan&&jikan.rating) ageRating=jikan.rating;

    var statusMap={'Finished Airing':'Finalizado','Currently Airing':'En emisión','Not yet aired':'Próximamente','Released':'Estrenada','In Production':'En producción','Planned':'Planeado','Canceled':'Cancelado'};
    var status='';
    if (tmdb&&tmdb.status) status=statusMap[tmdb.status]||tmdb.status;
    else if (jikan&&jikan.status) status=statusMap[jikan.status]||jikan.status;

    return { mainTitle,titleRomanized,titleOriginal,year,overview,genres,poster,backdrop,runtime,ageRating,director,ratings,trailer,releaseDate:release,status,malId:(jikan&&jikan.mal_id)||0,tmdbId };
  }

  /* ─────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────── */
  function renderWidget(d, blogBase, tmdbId) {
    if (d.backdrop||d.poster) document.getElementById('lw-hero-bg').style.backgroundImage="url('"+(d.backdrop||d.poster)+"')";
    if (d.poster||d.backdrop) document.getElementById('lw-player-poster').style.backgroundImage="url('"+(d.poster||d.backdrop)+"')";

    var heroMain = d.titleRomanized || d.mainTitle;
    document.getElementById('lw-title').innerHTML = esc(heroMain)+(d.year?' <span style="color:#666;font-weight:300;font-size:.55em;">('+d.year+')</span>':'');

    var extHtml='';
    if (d.originalTitle&&d.originalTitle!==heroMain) extHtml='<p style="color:#888;font-size:.82rem;margin:0;"><span style="color:#555;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-right:6px;">Original</span>'+esc(d.originalTitle)+'</p>';
    document.getElementById('lw-titles-extra').innerHTML=extHtml;

    var sep='<span style="width:1px;height:14px;background:#2a2a2a;display:inline-block;"></span>';
    var meta=[];
    var tmdbR=d.ratings.find(function(r){ return r.source==='TMDB'; });
    var malR =d.ratings.find(function(r){ return r.source==='MyAnimeList'; });
    if (tmdbR) meta.push('<span style="color:#01d277;font-weight:700;font-size:.9rem;">★ '+tmdbR.score.split(' ')[0]+'</span>');
    if (malR)  meta.push(sep+'<span class="lw-badge-mal">MAL</span><span style="font-weight:700;font-size:.88rem;">'+malR.score.split(' ')[0]+(malR.votes?' <span style="color:#666;font-size:.78rem;">('+malR.votes+')</span>':'')+'</span>');
    if (d.ageRating) meta.push(sep+'<span class="lw-badge-age">'+esc(d.ageRating)+'</span>');
    if (d.runtime!=='N/D') meta.push(sep+'<span style="color:#8a8a8a;font-size:.85rem;">⏱ '+esc(d.runtime)+'</span>');
    if (d.status) { var stC=d.status==='En emisión'?'background:rgba(0,180,255,.15);color:#00b4ff;border:1px solid rgba(0,180,255,.3)':d.status==='Finalizado'||d.status==='Estrenada'?'background:rgba(255,255,255,.06);color:#888;border:1px solid #2a2a2a':'background:rgba(255,102,0,.15);color:#ff9944;border:1px solid rgba(255,102,0,.3)'; meta.push(sep+'<span style="font-size:.75rem;padding:2px 8px;border-radius:4px;font-weight:700;'+stC+'">'+esc(d.status)+'</span>'); }
    document.getElementById('lw-meta-row').innerHTML=meta.join('');

    document.getElementById('lw-genres-row').innerHTML=d.genres.map(function(g){ return '<a href="'+blogBase+'/search/label/'+encodeURIComponent(g)+'" class="lw-genre-pill" rel="tag">'+esc(g)+'</a>'; }).join('');

    if (d.poster) document.getElementById('lw-poster').src=d.poster;
    var panelMain=d.titleRomanized||d.mainTitle;
    document.getElementById('lw-panel-title').textContent=panelMain;
    var sub='<div style="font-size:.7rem;color:#666;margin-bottom:3px;"><span style="color:#444;font-weight:700;text-transform:uppercase;font-size:.6rem;letter-spacing:.1em;margin-right:4px;">ROM</span>'+esc(panelMain)+'</div>';
    if (d.mainTitle&&d.mainTitle!==panelMain) sub+='<div style="font-size:.7rem;color:#666;margin-bottom:3px;"><span style="color:#444;font-weight:700;text-transform:uppercase;font-size:.6rem;letter-spacing:.1em;margin-right:4px;">ES</span>'+esc(d.mainTitle)+'</div>';
    if (d.titleOriginal&&d.titleOriginal!==panelMain&&d.titleOriginal!==d.mainTitle) sub+='<div style="font-size:.7rem;color:#555;"><span style="color:#444;font-weight:700;text-transform:uppercase;font-size:.6rem;letter-spacing:.1em;margin-right:4px;">ORI</span>'+esc(d.titleOriginal)+'</div>';
    document.getElementById('lw-panel-original').innerHTML=sub;
    document.getElementById('lw-panel-genres').innerHTML=d.genres.slice(0,4).map(function(g){ return '<a href="'+blogBase+'/search/label/'+encodeURIComponent(g)+'" class="lw-genre-chip-link" rel="tag">'+esc(g)+'</a>'; }).join('');
    document.getElementById('lw-director').textContent=d.director;

    renderRatings(d.ratings);

    var rows=[['Año',d.year||'N/D'],['Estreno',d.releaseDate],['Duración',d.runtime],['Director',d.director]];
    if (d.ageRating) rows.push(['Clasificación',d.ageRating]);
    if (d.status) rows.push(['Estado',d.status]);
    if (d.malId) rows.push(['MAL','<a href="https://myanimelist.net/anime/'+d.malId+'" target="_blank" rel="noopener" style="color:#2e51a2;">Ver en MAL ↗</a>']);
    if (tmdbId) rows.push(['TMDB','<a href="https://www.themoviedb.org/movie/'+tmdbId+'" target="_blank" rel="noopener" style="color:#01d277;">Ver en TMDB ↗</a>']);
    document.getElementById('lw-ficha').innerHTML=rows.map(function(r){ return '<div style="display:flex;justify-content:space-between;gap:8px;"><span style="color:#666;">'+r[0]+'</span><span style="color:#e0e0e0;font-weight:500;text-align:right;">'+r[1]+'</span></div>'; }).join('');

    var synEl=document.getElementById('lw-synopsis');
    synEl.textContent=d.overview;
    if (d.overview.length>220) document.getElementById('lw-syn-btn').style.display='inline';

    if (d.trailer && d.trailer.key) {
      trailerYtId = d.trailer.key;
      document.getElementById('lw-trailer-section').style.display='block';
      document.getElementById('lw-trailer-img').src='https://img.youtube.com/vi/'+d.trailer.key+'/maxresdefault.jpg';
      document.getElementById('lw-trailer-label').textContent=d.trailer.name||'Tráiler oficial';
      document.getElementById('lw-trailer-panel-section').style.display='block';
      document.getElementById('lw-trailer-panel-img').src='https://img.youtube.com/vi/'+d.trailer.key+'/hqdefault.jpg';
      document.getElementById('lw-trailer-panel-label').textContent=d.trailer.name||'Tráiler oficial';
      document.getElementById('lw-modal-label').textContent=d.mainTitle+' - '+(d.trailer.name||'Tráiler');
    }

    /* Imagen para feed de Blogger */
    (function(){
      var imgUrl = (tmdb && tmdb.backdrop_path) ? 'https://image.tmdb.org/t/p/original'+tmdb.backdrop_path : d.poster;
      if (!imgUrl) return;
      var wrap=document.createElement('div'); wrap.id='lw-feed-poster'; wrap.className='poster-container'; wrap.style.display='none';
      var img=document.createElement('img'); img.src=imgUrl; img.alt=d.mainTitle; wrap.appendChild(img);
      var loading=document.getElementById('lw-loading');
      if (loading&&loading.parentNode) loading.parentNode.insertBefore(wrap,loading);
    })();

    setTimeout(function(){ document.querySelectorAll('.lw-rbar-fill[data-pct]').forEach(function(b){ b.style.width=Math.min(parseFloat(b.getAttribute('data-pct')),100)+'%'; }); },350);
    injectSEO(d);
  }

  function renderRatings(ratings) {
    var el=document.getElementById('lw-ratings');
    if (!ratings.length){ el.innerHTML='<p style="color:#555;font-size:.8rem;">Sin calificaciones disponibles.</p>'; return; }
    el.innerHTML=ratings.map(function(r){
      var badge=r.icon==='MAL'?'<span class="lw-badge-mal">MAL</span>':'<span class="lw-badge-tmdb">TMDB</span>';
      return '<div><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;"><div style="display:flex;align-items:center;gap:8px;">'+badge+'<span style="font-weight:700;color:#fff;font-size:.88rem;">'+esc(r.score)+(r.votes?' <span style="color:#666;font-size:.75rem;">('+esc(r.votes)+')</span>':'')+'</span></div><span style="color:#555;font-size:.75rem;">'+esc(r.source)+'</span></div><div class="lw-rbar-bg"><div class="lw-rbar-fill" data-pct="'+r.pct+'" style="background:'+r.color+';"></div></div></div>';
    }).join('');
  }

  /* ─────────────────────────────────────────────────────────────
     REPRODUCTOR
  ───────────────────────────────────────────────────────────── */
  function getActiveLangServers() { var l=LW_LANGS.find(function(l){ return l.key===activeLangKey; }); return (l&&l.servers)?l.servers:[]; }

  function renderServers() {
    var sel=document.getElementById('lw-lang-select'); sel.innerHTML='';
    LW_LANGS.forEach(function(l){ if(!l.enabled) return; var o=document.createElement('option'); o.value=l.key; o.textContent=l.flag+' '+l.label; if(l.key===activeLangKey) o.selected=true; sel.appendChild(o); });
    var cur=LW_LANGS.find(function(l){ return l.key===activeLangKey; });
    if (cur) document.getElementById('lw-lang-flag').textContent=cur.flag;
    var servers=getActiveLangServers();
    var cont=document.getElementById('lw-server-tabs');
    cont.innerHTML=servers.map(function(s,i){ return '<button class="lw-server-tab '+(i===0?'active':'')+'" onclick="lwSwitchServer(this,'+i+')">'+esc(s.name)+'</button>'; }).join('');
    activeServer=0;
    if (servers.length) document.getElementById('lw-play-label').textContent='Reproducir: '+servers[0].name;
  }

  window.lwChangeLang = function(sel) {
    activeLangKey=sel.value;
    var lang=LW_LANGS.find(function(l){ return l.key===activeLangKey; });
    document.getElementById('lw-lang-flag').textContent=lang?lang.flag:'🌐';
    resetPlayer();
    var servers=getActiveLangServers();
    document.getElementById('lw-server-tabs').innerHTML=servers.map(function(s,i){ return '<button class="lw-server-tab '+(i===0?'active':'')+'" onclick="lwSwitchServer(this,'+i+')">'+esc(s.name)+'</button>'; }).join('');
    activeServer=0;
    document.getElementById('lw-play-label').textContent=servers.length?'Reproducir: '+servers[0].name:'Reproducir';
    lwToast('OK',(lang?lang.flag+' ':'')+( lang?lang.label:sel.value));
  };

  window.lwSwitchServer = function(el, idx) {
    activeServer=idx;
    document.querySelectorAll('.lw-server-tab').forEach(function(t){ t.classList.remove('active'); });
    el.classList.add('active');
    resetPlayer();
    document.getElementById('lw-play-label').textContent='Reproducir: '+el.textContent;
    lwToast('OK','Servidor: '+el.textContent);
  };

  window.lwStartPlayer = function() {
    var servers=getActiveLangServers();
    var server=servers[activeServer]||{name:'?',url:''};
    var pw=document.getElementById('lw-player-wrap');
    var overlay=document.getElementById('lw-play-overlay');
    var poster=document.getElementById('lw-player-poster');
    var existing=document.getElementById('lw-active-player');
    if (existing) existing.remove();
    var div=document.createElement('div'); div.id='lw-active-player'; div.style.cssText='position:absolute;inset:0;z-index:20;';
    if (server.url&&server.url.trim()!=='') {
      var iframe=document.createElement('iframe'); iframe.src=server.url; iframe.style.cssText='width:100%;height:100%;border:none;display:block;'; iframe.allowFullscreen=true;
      div.appendChild(iframe); pw.appendChild(div); overlay.style.display='none'; poster.style.display='none';
    } else {
      var langLabel=(LW_LANGS.find(function(l){ return l.key===activeLangKey; })||{}).label||activeLangKey;
      div.style.cssText+='display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:#0d0d0d;';
      div.innerHTML='<svg style="width:42px;height:42px;color:#00b4ff;" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><p style="color:#555;font-size:.82rem;font-family:Outfit,sans-serif;text-align:center;padding:0 24px;">Servidor: <strong style="color:#e0e0e0;">'+esc(server.name)+'</strong> — Idioma: <strong style="color:#00b4ff;">'+esc(langLabel)+'</strong><br><span style="color:#333;font-size:.72rem;margin-top:4px;display:block;">Agrega la URL del embed en LW_LANGS</span></p>';
      pw.appendChild(div); overlay.style.display='none'; poster.style.display='none';
    }
  };

  function resetPlayer() {
    var ex=document.getElementById('lw-active-player'); if(ex) ex.remove();
    document.getElementById('lw-play-overlay').style.display='flex';
    document.getElementById('lw-player-poster').style.display='block';
  }

  window.lwOpenTrailer = function(id) {
    if (!id) return;
    document.getElementById('lw-modal-iframe').src='https://www.youtube.com/embed/'+id+'?autoplay=1';
    document.getElementById('lw-modal').classList.add('lw-active');
    document.body.style.overflow='hidden';
  };
  window.lwCloseTrailer = function() {
    document.getElementById('lw-modal').classList.remove('lw-active');
    document.getElementById('lw-modal-iframe').src='';
    document.body.style.overflow='';
  };
  window.lwCloseTrailerOutside = function(e) { if(e.target===document.getElementById('lw-modal')) window.lwCloseTrailer(); };
  window.lwExpandSyn = function() { var el=document.getElementById('lw-synopsis'); el.style['-webkit-line-clamp']='unset'; el.style.display='block'; document.getElementById('lw-syn-btn').style.display='none'; };
  window.lwShare = function(net) { var url=encodeURIComponent(window.location.href); var title=encodeURIComponent(document.title); var links={twitter:'https://twitter.com/intent/tweet?text='+title+'&url='+url,facebook:'https://www.facebook.com/sharer/sharer.php?u='+url}; if(links[net]) window.open(links[net],'_blank','width=600,height=400'); lwToast('OK','Compartiendo en '+net+'…'); };
  window.lwCopyLink = function() { try{navigator.clipboard.writeText(window.location.href);}catch(e){} lwToast('OK','Enlace copiado'); };
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') window.lwCloseTrailer(); });

  /* ─────────────────────────────────────────────────────────────
     SEO
  ───────────────────────────────────────────────────────────── */
  function injectSEO(d) {
    var seoTitle=(d.titleRomanized||d.mainTitle)+(d.year?' ('+d.year+')':'')+' - Ver Online Latino';
    var seoDesc=(d.overview||'').slice(0,160);
    var seoImg=d.poster||d.backdrop||'';
    var seoUrl=window.location.href;
    try{document.title=seoTitle;}catch(e){}
    function setName(n,v){ var el=document.querySelector('meta[name="'+n+'"]'); if(!el){el=document.createElement('meta');el.setAttribute('name',n);document.head.appendChild(el);} el.setAttribute('content',v); }
    function setProp(p,v){ var el=document.querySelector('meta[property="'+p+'"]'); if(!el){el=document.createElement('meta');el.setAttribute('property',p);document.head.appendChild(el);} el.setAttribute('content',v); }
    setName('description',seoDesc); setName('robots','index, follow');
    setProp('og:title',seoTitle); setProp('og:description',seoDesc); setProp('og:image',seoImg); setProp('og:url',seoUrl); setProp('og:type','video.movie'); setProp('og:locale','es_MX');
    setName('twitter:card','summary_large_image'); setName('twitter:title',seoTitle); setName('twitter:description',seoDesc); setName('twitter:image',seoImg);
    var canon=document.querySelector('link[rel="canonical"]'); if(!canon){canon=document.createElement('link');canon.setAttribute('rel','canonical');document.head.appendChild(canon);} canon.setAttribute('href',seoUrl);
    var bestR=(d.ratings||[]).find(function(r){ return r.source==='MyAnimeList'; })||(d.ratings||[]).find(function(r){ return r.source==='TMDB'; });
    var jsonLd={'@context':'https://schema.org','@type':'Movie','name':d.mainTitle,'alternateName':[d.titleRomanized,d.titleOriginal].filter(Boolean),'description':d.overview||'','image':seoImg,'datePublished':d.year||'','genre':d.genres||[],'url':seoUrl,'inLanguage':'es','aggregateRating':bestR?{'@type':'AggregateRating','ratingValue':bestR.score.split(' ')[0],'bestRating':'10','ratingCount':bestR.votes?bestR.votes.replace(/\D/g,''):undefined}:undefined};
    var ld=document.getElementById('lw-jsonld')||(function(){ var s=document.createElement('script');s.type='application/ld+json';s.id='lw-jsonld';document.head.appendChild(s);return s; })();
    ld.textContent=JSON.stringify(jsonLd,function(k,v){ return v===undefined?undefined:v; },2);
  }

  /* Solo corre si la página tiene config de película */
  function shouldRun() { try { return typeof LW_MOVIE !== 'undefined'; } catch(e) { return false; } }
  if (shouldRun()) {
    if (document.readyState==='loading') { document.addEventListener('DOMContentLoaded',init); } else { init(); }
  }

})();
