/**
 * AdBlock & Background Audio scripts for YouTube & YouTube Music
 *
 * Architecture:
 * 1. PRELOAD script (injectedJavaScriptBeforeContentLoaded):
 *    - Patches JSON.parse to strip ad data from ALL parsed JSON (catches inline scripts)
 *    - Intercepts fetch/XHR to block ad network requests and clean player API responses
 *    - Traps ytInitialPlayerResponse setter to neutralize pre-roll ads
 *    - Patches Visibility API for background audio
 *
 * 2. POST-LOAD script (injectedJavaScript):
 *    - CSS hiding of ad banners, overlays, promos
 *    - High-frequency ad skip loop (50ms) + MutationObserver
 *    - Player API direct skip (movie_player.skipAd / cancelPlayback)
 *    - YouTube Shorts ad blocking
 *    - Promo/dialog auto-dismiss
 *
 * 3. RE-INJECTION script: Injected on every SPA navigation via onNavigationStateChange
 *    to ensure ad blocking persists across YouTube's client-side page transitions
 */

export const ADBLOCK_CSS = `
  /* ===== YouTube Video Ad Overlays ===== */
  #player-ads,
  .ytp-ad-module,
  .ytp-ad-overlay-container,
  .ytp-ad-message-container,
  .ytp-ad-action-interstitial,
  .ytp-ad-progress-list,
  .ytp-ad-player-overlay,
  .ytp-ad-player-overlay-layout,
  .ytp-ad-player-overlay-flyout-cta,
  .ytp-ad-player-overlay-skip-or-preview,
  .ytp-ad-skip-ad-slot,
  .video-ads.ytp-ad-module,
  .ytp-ad-image-overlay,
  .ytp-ad-text-overlay,

  /* ===== YouTube Feed/Search Ads ===== */
  ytd-promoted-video-renderer,
  ytd-compact-promoted-video-renderer,
  ytd-promoted-sparkles-web-renderer,
  ytd-promoted-sparkles-text-search-web-renderer,
  ytd-in-feed-ad-layout-renderer,
  ytd-ad-slot-renderer,
  ytd-banner-promo-renderer,
  ytd-statement-banner-renderer,
  ytd-rich-item-renderer:has(ytd-ad-slot-renderer),
  ytd-reel-shelf-renderer:has(ytd-ad-slot-renderer),

  /* ===== YouTube Mobile (m.youtube.com) Ads ===== */
  ytm-promoted-sparkles-web-renderer,
  ytm-companion-ad-renderer,
  ytm-promoted-video-renderer,
  ytm-ad-slot-renderer,
  .companion-ad-container,
  .ad-container,
  .videoAdUi,

  /* ===== YouTube Shorts Ads ===== */
  ytd-reel-video-renderer ytd-ad-slot-renderer,
  ytd-reel-video-renderer .ytp-ad-module,
  ytd-reel-video-renderer .ytp-ad-overlay-container,
  .reel-player-overlay-renderer .ad-container,
  ytm-reel-multi-format-ad-renderer,
  ytm-shorts-ad-slot-renderer,
  .ytShortsAdOverlayHost,
  [class*="shorts-ad"],
  [class*="reel-ad"],

  /* ===== Promos & Banners ===== */
  yt-mealbar-promo-renderer,
  .mealbar-promo-renderer,
  #clarification-renderer,
  ytmusic-mealbar-promo-renderer,
  ytmusic-banner-promo-renderer,
  ytmusic-popup-container ytmusic-mealbar-promo-renderer,
  ytmusic-guide-entry-renderer[is-upgrade-button],
  #upgrade-button,
  .ytmusic-mealbar-promo-renderer,
  ytmusic-player-bar .ad-interrupting {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    height: 0 !important;
    max-height: 0 !important;
    width: 0 !important;
    overflow: hidden !important;
    pointer-events: none !important;
    position: absolute !important;
  }
`;

/**
 * PRELOAD script — runs before page DOM is constructed.
 * Core strategy: Patch JSON.parse globally so ANY ad data YouTube parses
 * from inline scripts or API responses gets stripped before the player sees it.
 */
export const ADBLOCK_PRELOAD_JS = `
(function() {
  if (window.__YT_ADBLOCK_V2__) return;
  window.__YT_ADBLOCK_V2__ = true;

  // ============================================================
  // 1. Universal ad data stripper
  // ============================================================
  function stripAds(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    try {
      var adKeys = [
        'adPlacements', 'playerAds', 'adSlots', 'adBreakHeartbeatParams',
        'adBreakParams', 'adPlacementConfig',
        'instreamAdBreaks', 'linearAds'
      ];
      for (var i = 0; i < adKeys.length; i++) {
        if (obj[adKeys[i]]) delete obj[adKeys[i]];
      }
      if (obj.playerConfig && obj.playerConfig.adConfig) {
        delete obj.playerConfig.adConfig;
      }
      // Strip from playerResponse nested inside other responses
      if (obj.playerResponse) {
        stripAds(obj.playerResponse);
      }
      if (obj.contents && obj.contents.singleColumnWatchNextResults &&
          obj.contents.singleColumnWatchNextResults.autoplay &&
          obj.contents.singleColumnWatchNextResults.autoplay.autoplay) {
        var sets = obj.contents.singleColumnWatchNextResults.autoplay.autoplay.sets;
        if (sets) {
          for (var s = 0; s < sets.length; s++) {
            if (sets[s] && sets[s].autoplayVideo && sets[s].autoplayVideo.playerAds) {
              delete sets[s].autoplayVideo.playerAds;
            }
          }
        }
      }
    } catch(e) {}
    return obj;
  }

  // ============================================================
  // 2. Patch JSON.parse — catches ALL ad data including inline <script> tags
  // ============================================================
  try {
    var _origParse = JSON.parse;
    JSON.parse = function() {
      var result = _origParse.apply(this, arguments);
      if (result && typeof result === 'object') {
        // Only process objects that look like YouTube player data
        if (result.adPlacements || result.playerAds || result.adSlots ||
            result.adBreakHeartbeatParams || result.playerResponse) {
          stripAds(result);
          try {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({type:'AD_STRIPPED_PLAYER'}));
            }
          } catch(e) {}
        }
      }
      return result;
    };
    // Preserve toString so fingerprinting checks pass
    JSON.parse.toString = function() { return 'function parse() { [native code] }'; };
  } catch(e) {}

  // ============================================================
  // 3. Trap ytInitialPlayerResponse (set before our code sometimes)
  // ============================================================
  try {
    if (window.ytInitialPlayerResponse) {
      stripAds(window.ytInitialPlayerResponse);
    }
    var _ytIpr = window.ytInitialPlayerResponse;
    Object.defineProperty(window, 'ytInitialPlayerResponse', {
      get: function() { return _ytIpr; },
      set: function(v) { _ytIpr = stripAds(v); },
      configurable: true, enumerable: true
    });
  } catch(e) {}

  // Also trap ytInitialData
  try {
    if (window.ytInitialData) {
      stripAds(window.ytInitialData);
    }
    var _ytId = window.ytInitialData;
    Object.defineProperty(window, 'ytInitialData', {
      get: function() { return _ytId; },
      set: function(v) { _ytId = stripAds(v); },
      configurable: true, enumerable: true
    });
  } catch(e) {}

  // ============================================================
  // 4. Prevent background playback pause (Visibility API & Screen-Off)
  // ============================================================
  try {
    Object.defineProperty(document, 'hidden', {
      get: function() { return false; },
      configurable: true
    });
    Object.defineProperty(document, 'visibilityState', {
      get: function() { return 'visible'; },
      configurable: true
    });
    try {
      document.hasFocus = function() { return true; };
    } catch(e) {}

    var _origAEL = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      if (type === 'visibilitychange' || type === 'webkitvisibilitychange' || type === 'pagehide') return;
      return _origAEL.call(this, type, listener, options);
    };
  } catch(e) {}

  // ============================================================
  // 4.1 MediaSession Interception & Native Notification Bridge
  // ============================================================
  try {
    window.__mediaActionHandlers = {};

    if (navigator.mediaSession) {
      // Intercept setActionHandler so we can trigger YouTube actions (next, prev, play, pause)
      var _origSetActionHandler = navigator.mediaSession.setActionHandler;
      navigator.mediaSession.setActionHandler = function(action, handler) {
        window.__mediaActionHandlers[action] = handler;
        return _origSetActionHandler.call(this, action, handler);
      };

      // Intercept metadata to send current song Title, Artist, Artwork to React Native
      var _origMetadata = navigator.mediaSession.metadata;
      Object.defineProperty(navigator.mediaSession, 'metadata', {
        get: function() { return _origMetadata; },
        set: function(meta) {
          _origMetadata = meta;
          try {
            if (meta && window.ReactNativeWebView) {
              var artworkUrl = '';
              if (meta.artwork && meta.artwork.length > 0) {
                artworkUrl = meta.artwork[meta.artwork.length - 1].src || '';
              }
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'MEDIA_METADATA',
                title: meta.title || '',
                artist: meta.artist || '',
                album: meta.album || '',
                artwork: artworkUrl
              }));
            }
          } catch(e) {}
        },
        configurable: true,
        enumerable: true
      });
    }

    // Expose control functions invoked by notification action buttons
    window.__ytMediaPlay = function() {
      try {
        if (window.__mediaActionHandlers && window.__mediaActionHandlers['play']) {
          window.__mediaActionHandlers['play']();
          return;
        }
        var p = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
        if (p && typeof p.playVideo === 'function') { p.playVideo(); return; }
        var v = document.querySelector('video');
        if (v) { v.play(); return; }
        var btn = document.querySelector('.play-pause-button, .ytp-play-button, #play-pause-button');
        if (btn) btn.click();
      } catch(e) {}
    };

    window.__ytMediaPause = function() {
      try {
        if (window.__mediaActionHandlers && window.__mediaActionHandlers['pause']) {
          window.__mediaActionHandlers['pause']();
          return;
        }
        var p = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
        if (p && typeof p.pauseVideo === 'function') { p.pauseVideo(); return; }
        var v = document.querySelector('video');
        if (v) { v.pause(); return; }
        var btn = document.querySelector('.play-pause-button, .ytp-play-button, #play-pause-button');
        if (btn) btn.click();
      } catch(e) {}
    };

    window.__ytMediaToggle = function() {
      try {
        var v = document.querySelector('video');
        if (v) {
          if (v.paused) window.__ytMediaPlay();
          else window.__ytMediaPause();
        } else {
          window.__ytMediaPlay();
        }
      } catch(e) {}
    };

    window.__ytMediaNext = function() {
      try {
        if (window.__mediaActionHandlers && window.__mediaActionHandlers['nexttrack']) {
          window.__mediaActionHandlers['nexttrack']();
          return;
        }
        var p = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
        if (p && typeof p.nextVideo === 'function') { p.nextVideo(); return; }
        var btn = document.querySelector('.next-button, .ytp-next-button, #next-button, [aria-label*="Next"], [aria-label*="ถัดไป"]');
        if (btn) btn.click();
      } catch(e) {}
    };

    window.__ytMediaPrev = function() {
      try {
        if (window.__mediaActionHandlers && window.__mediaActionHandlers['previoustrack']) {
          window.__mediaActionHandlers['previoustrack']();
          return;
        }
        var p = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
        if (p && typeof p.previousVideo === 'function') { p.previousVideo(); return; }
        var btn = document.querySelector('.previous-button, .ytp-prev-button, #previous-button, [aria-label*="Previous"], [aria-label*="ก่อนหน้า"]');
        if (btn) btn.click();
      } catch(e) {}
    };

    // Helper to send title fallback and playback state updates
    function reportMediaState(isPlaying) {
      try {
        if (!window.ReactNativeWebView) return;
        var meta = navigator.mediaSession && navigator.mediaSession.metadata;
        var title = (meta && meta.title) || '';
        var artist = (meta && meta.artist) || '';

        // Fallback for YouTube Music and YouTube Web DOM
        if (!title) {
          var titleEl = document.querySelector('ytmusic-player-bar .title, .slim-video-metadata-title, h1.title, .ytp-title-link');
          if (titleEl) title = titleEl.textContent ? titleEl.textContent.trim() : '';
        }
        if (!artist) {
          var bylineEl = document.querySelector('ytmusic-player-bar .byline, ytm-slim-owner-renderer .owner-name, #channel-name');
          if (bylineEl) artist = bylineEl.textContent ? bylineEl.textContent.trim() : '';
        }

        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'MEDIA_PLAY_STATE',
          isPlaying: isPlaying,
          title: title,
          artist: artist
        }));
      } catch(e) {}
    }

    document.addEventListener('play', function(e) {
      if (e.target && e.target.tagName === 'VIDEO') {
        reportMediaState(true);
      }
    }, true);

    document.addEventListener('pause', function(e) {
      if (e.target && e.target.tagName === 'VIDEO') {
        reportMediaState(false);
      }
    }, true);
  } catch(e) {}

  // ============================================================
  // 5. Network-level ad blocking (fetch + XHR)
  // ============================================================
  var blocked = [
    'doubleclick.net', 'googleads.g.doubleclick.net',
    'pagead2.googlesyndication.com', '/pagead/',
    '/api/stats/ads', '/pcs/activeview',
    'youtube.com/api/stats/qoe?adformat',
    'youtube.com/pagead/', 'youtube.com/ptracking',
    'google.com/pagead/', 'static.doubleclick.net',
    'ad.youtube.com', 'ads.youtube.com'
  ];

  function isAdUrl(url) {
    if (!url || typeof url !== 'string') return false;
    for (var i = 0; i < blocked.length; i++) {
      if (url.indexOf(blocked[i]) !== -1) return true;
    }
    return false;
  }

  // Fetch interception
  var _origFetch = window.fetch;
  window.fetch = function() {
    var url = typeof arguments[0] === 'string' ? arguments[0] :
              (arguments[0] && arguments[0].url) || '';
    if (isAdUrl(url)) {
      try {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({type:'AD_BLOCKED_NETWORK'}));
        }
      } catch(e) {}
      return Promise.resolve(new Response('{}', {
        status: 200, headers: {'Content-Type':'application/json'}
      }));
    }
    return _origFetch.apply(this, arguments);
  };
  window.fetch.toString = function() { return 'function fetch() { [native code] }'; };

  // XHR interception
  var _origOpen = XMLHttpRequest.prototype.open;
  var _origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url) {
    this.__blocked = isAdUrl(url);
    this.__url = url;
    return _origOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function() {
    if (this.__blocked) {
      try {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({type:'AD_BLOCKED_NETWORK'}));
        }
      } catch(e) {}
      try {
        Object.defineProperty(this, 'readyState', {value:4, writable:true});
        Object.defineProperty(this, 'status', {value:200, writable:true});
        Object.defineProperty(this, 'responseText', {value:'{}', writable:true});
        Object.defineProperty(this, 'response', {value:'{}', writable:true});
        var self = this;
        setTimeout(function() {
          try {
            if (typeof self.onreadystatechange === 'function')
              self.onreadystatechange(new Event('readystatechange'));
            if (typeof self.onload === 'function')
              self.onload(new Event('load'));
            if (typeof self.onloadend === 'function')
              self.onloadend(new Event('loadend'));
            self.dispatchEvent(new Event('load'));
            self.dispatchEvent(new Event('loadend'));
          } catch(e) {}
        }, 0);
      } catch(e) {}
      return;
    }
    return _origSend.apply(this, arguments);
  };
})();
true;
`;

/**
 * POST-LOAD + RE-INJECTION script.
 * This is designed to be safe to call multiple times (idempotent).
 * It's called once on initial page load AND re-injected on every SPA navigation.
 */
export const getAdblockInjectedCode = (adBlockEnabled: boolean = true) => `
(function() {
  // ============================================================
  // Inject CSS (safe to call multiple times)
  // ============================================================
  if (!document.getElementById('__ytab_css')) {
    var s = document.createElement('style');
    s.id = '__ytab_css';
    s.textContent = \`${ADBLOCK_CSS}\`;
    (document.head || document.documentElement).appendChild(s);
  }

  if (!${adBlockEnabled}) return;

  // ============================================================
  // State (only initialize once)
  // ============================================================
  if (!window.__ytab_state) {
    window.__ytab_state = {
      wasAd: false,
      prevMuted: false,
      loopId: null,
      observerAttached: false
    };
  }
  var S = window.__ytab_state;

  // ============================================================
  // Helper: Simulate real click (touch + pointer + mouse + click)
  // ============================================================
  function realClick(el) {
    if (!el) return false;
    try {
      // Get element center for realistic coordinates
      var rect = el.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var opts = {bubbles:true, cancelable:true, view:window, clientX:cx, clientY:cy};

      el.dispatchEvent(new PointerEvent('pointerdown', opts));
      el.dispatchEvent(new PointerEvent('pointerup', opts));
      el.dispatchEvent(new MouseEvent('mousedown', opts));
      el.dispatchEvent(new MouseEvent('mouseup', opts));
      el.dispatchEvent(new MouseEvent('click', opts));

      // Also try direct .click() as fallback
      if (typeof el.click === 'function') el.click();
      return true;
    } catch(e) {
      try { el.click(); return true; } catch(e2) {}
    }
    return false;
  }

  // ============================================================
  // Helper: Get YouTube player object
  // ============================================================
  function getPlayer() {
    var el = document.getElementById('movie_player');
    if (!el) el = document.querySelector('.html5-video-player');
    if (!el) el = document.querySelector('ytm-player');
    return el;
  }

  // ============================================================
  // Core: Try to skip ad via player API (most reliable)
  // ============================================================
  function tryPlayerApiSkip(player) {
    if (!player) return false;
    try {
      // Direct skipAd method
      if (typeof player.skipAd === 'function') {
        player.skipAd();
        return true;
      }
    } catch(e) {}
    try {
      // cancelPlayback for unskippable ads
      if (typeof player.cancelPlayback === 'function') {
        player.cancelPlayback();
        return true;
      }
    } catch(e) {}
    try {
      // finishAd
      if (typeof player.finishAd === 'function') {
        player.finishAd();
        return true;
      }
    } catch(e) {}
    try {
      // getAdState returns >0 when ad is playing, try to advance
      if (typeof player.getAdState === 'function' && player.getAdState() > 0) {
        if (typeof player.seekTo === 'function') {
          var v = player.querySelector('video');
          if (v && v.duration) player.seekTo(v.duration);
        }
      }
    } catch(e) {}
    return false;
  }

  // ============================================================
  // Core: Detect ad state
  // ============================================================
  function isAdActive() {
    var player = getPlayer();

    // 1. CSS class check (most reliable across versions)
    if (player && (
      player.classList.contains('ad-showing') ||
      player.classList.contains('ad-interrupting')
    )) return true;

    // 2. Player API check
    try {
      if (player && typeof player.getAdState === 'function' && player.getAdState() > 0)
        return true;
    } catch(e) {}

    // 3. Ad overlay elements present
    if (document.querySelector('.ytp-ad-player-overlay, .ytp-ad-player-overlay-layout'))
      return true;

    // 4. Skip button visible (definitive proof an ad is playing)
    if (document.querySelector(
      '.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button,' +
      '.ytp-ad-skip-button-slot, .ytp-ad-skip-button-container'
    )) return true;

    // 5. Ad preview text visible
    if (document.querySelector('.ytp-ad-preview-container, .ytp-ad-text'))
      return true;

    return false;
  }

  // ============================================================
  // Core: Click ALL possible skip buttons
  // ============================================================
  function clickAllSkipButtons() {
    var selectors = [
      // Modern YouTube skip buttons
      '.ytp-ad-skip-button',
      '.ytp-ad-skip-button-modern',
      '.ytp-ad-skip-button-modern .ytp-ad-skip-button-text',
      '.ytp-skip-ad-button',
      'button.ytp-ad-skip-button-modern',
      // Container-based
      '.ytp-ad-skip-button-slot button',
      '.ytp-ad-skip-button-slot div[role="button"]',
      '.ytp-ad-skip-button-container button',
      '.ytp-ad-skip-button-container div[role="button"]',
      // Mobile
      '.videoAdUiSkipButton',
      '.skip-button',
      '[id*="skip-button"] button',
      // Overlay close
      '.ytp-ad-overlay-close-button',
      '.ytp-ad-overlay-close-container',
      // Thai / English aria-label matching
      'button[aria-label*="Skip"]',
      'button[aria-label*="skip"]',
      'button[aria-label*="ข้าม"]',
      'button[aria-label*="ข้ามโฆษณา"]',
      // Generic skip-related
      '[class*="skip-button"]',
      '[class*="skipButton"]',
      '[class*="skip-ad"]',
      '[class*="skipAd"]',
      // Renderer-based (new YouTube)
      'ytd-button-renderer#skip-button\\:6 button',
      'tp-yt-paper-button#skip-button',
      '#skip-button\\:6',
      '#ad-skip-button'
    ];

    var clicked = false;
    for (var i = 0; i < selectors.length; i++) {
      try {
        var els = document.querySelectorAll(selectors[i]);
        for (var j = 0; j < els.length; j++) {
          if (els[j] && els[j].offsetParent !== null) { // visible check
            if (realClick(els[j])) clicked = true;
          }
        }
      } catch(e) {}
    }
    return clicked;
  }

  // ============================================================
  // Core: Handle Shorts ads
  // ============================================================
  function handleShortsAds() {
    // Remove Shorts ad overlays
    var shortsAdSelectors = [
      'ytd-reel-video-renderer ytd-ad-slot-renderer',
      'ytm-reel-multi-format-ad-renderer',
      'ytm-shorts-ad-slot-renderer',
      '.ytShortsAdOverlayHost',
      '[class*="shorts-ad"]',
      '[class*="reel-ad"]',
      '.reel-player-overlay-renderer .ad-container',
      'ytd-reel-video-renderer .ytp-ad-module',
      'ytd-reel-video-renderer .ytp-ad-overlay-container'
    ];

    for (var i = 0; i < shortsAdSelectors.length; i++) {
      try {
        var ads = document.querySelectorAll(shortsAdSelectors[i]);
        for (var j = 0; j < ads.length; j++) {
          ads[j].remove();
        }
      } catch(e) {}
    }

    // Check if current Shorts reel is an ad and skip it
    try {
      var reelPlayers = document.querySelectorAll('ytd-reel-video-renderer, ytm-reel-video-renderer');
      for (var k = 0; k < reelPlayers.length; k++) {
        var reel = reelPlayers[k];
        if (reel.querySelector('ytd-ad-slot-renderer') ||
            reel.querySelector('[class*="ad-slot"]') ||
            reel.hasAttribute('is-ad')) {
          // Try to swipe/navigate to next Short
          try {
            var nextBtn = document.querySelector(
              'button[aria-label*="Next"], button[aria-label*="ถัดไป"],' +
              '.navigation-button-down, [class*="navigation-button"]'
            );
            if (nextBtn) realClick(nextBtn);
          } catch(e) {}
          // Remove the ad reel
          try { reel.remove(); } catch(e) {}
        }
      }
    } catch(e) {}
  }

  // ============================================================
  // Core: Main ad-check loop
  // ============================================================
  function mainLoop() {
    var adActive = isAdActive();
    var player = getPlayer();
    var video = document.querySelector('video');

    if (adActive) {
      // === AD IS PLAYING ===

      // 1. Try player API skip first (instant, no visual glitch)
      tryPlayerApiSkip(player);

      // 2. Click skip buttons
      clickAllSkipButtons();

      // 3. Fast-forward the ad video
      if (video) {
        if (!S.wasAd) {
          S.wasAd = true;
          S.prevMuted = video.muted;
        }
        video.muted = true;

        // Set max playback speed
        try { video.playbackRate = 16; } catch(e) {
          try { video.playbackRate = 8; } catch(e2) {}
        }

        // Jump to end
        if (isFinite(video.duration) && video.duration > 0 && video.duration < 300) {
          video.currentTime = video.duration - 0.1;
        }
      }

      // 4. Notify
      try {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({type:'VIDEO_AD_SKIPPED'}));
        }
      } catch(e) {}

    } else if (S.wasAd) {
      // === AD JUST ENDED — restore normal state ===
      S.wasAd = false;
      if (video) {
        video.playbackRate = 1;
        video.muted = S.prevMuted;
      }
    }

    // === Always: handle Shorts ads ===
    handleShortsAds();

    // === Always: dismiss promo dialogs ===
    dismissPromos();
  }

  // ============================================================
  // Core: Dismiss promo/premium dialogs
  // ============================================================
  function dismissPromos() {
    var dismissSelectors = [
      'ytmusic-you-there-renderer button',
      'yt-mealbar-promo-renderer #dismiss-button',
      'ytmusic-mealbar-promo-renderer #dismiss-button',
      'tp-yt-paper-dialog #dismiss-button',
      'yt-button-renderer#dismiss-button button',
      '.ytmusic-mealbar-promo-renderer button',
      '#dismiss-button yt-button-shape button',
      'tp-yt-paper-dialog .yt-spec-button-shape-next--outline'
    ];
    for (var i = 0; i < dismissSelectors.length; i++) {
      try {
        var btn = document.querySelector(dismissSelectors[i]);
        if (btn) { realClick(btn); break; }
      } catch(e) {}
    }
  }

  // ============================================================
  // Start the engine (safe to call multiple times)
  // ============================================================

  // Kill any previous loop before starting fresh
  if (S.loopId) {
    clearInterval(S.loopId);
    S.loopId = null;
  }
  // High-frequency loop: 50ms (20 checks/second)
  S.loopId = setInterval(mainLoop, 50);

  // Run immediately
  mainLoop();

  // MutationObserver (only attach once)
  if (!S.observerAttached) {
    S.observerAttached = true;
    try {
      var mo = new MutationObserver(function(mutations) {
        // Only react to class/attribute changes on player or ad-related nodes
        for (var i = 0; i < mutations.length; i++) {
          var t = mutations[i].target;
          if (t && t.id === 'movie_player') { mainLoop(); return; }
          if (t && t.className && typeof t.className === 'string' &&
              (t.className.indexOf('ad-') !== -1 || t.className.indexOf('ytp-ad') !== -1)) {
            mainLoop();
            return;
          }
        }
      });
      mo.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
      });
    } catch(e) {}

    // Video events
    document.addEventListener('play', mainLoop, true);
    document.addEventListener('playing', mainLoop, true);
  }
})();
true;
`;

/**
 * Lightweight re-injection script for SPA navigations.
 * Re-triggers the ad blocker loop and CSS injection without
 * waiting for a full page reload.
 */
export const AD_REINJECT_JS = `
(function() {
  // Reset the loop to ensure fresh detection on new video
  if (window.__ytab_state) {
    window.__ytab_state.wasAd = false;
    if (window.__ytab_state.loopId) {
      clearInterval(window.__ytab_state.loopId);
      window.__ytab_state.loopId = null;
    }
  }
})();
true;
`;
