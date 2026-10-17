import React, {
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { CONFIG } from '../constants/config';
import { ADBLOCK_PRELOAD_JS, getAdblockInjectedCode, AD_REINJECT_JS } from '../utils/adblock';

export interface WebContainerHandle {
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  goHome: () => void;
  loginGoogle: () => void;
  clearCache: () => void;
  pauseTab: (tab: 'youtube' | 'music') => void;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
}

interface WebContainerProps {
  activeTab: 'youtube' | 'music';
  adBlockEnabled: boolean;
  isDesktopMode: boolean;
  onAdBlocked: () => void;
  onNavStateChange: (state: { canGoBack: boolean; canGoForward: boolean; url: string }) => void;
  onMediaChange?: (media: {
    title: string;
    artist: string;
    artwork?: string;
    isPlaying: boolean;
    tab: 'youtube' | 'music';
  }) => void;
}

/** URL patterns to block at the WebView request level (before network fetch) */
const AD_URL_PATTERNS = [
  'doubleclick.net',
  'googleads.g.doubleclick.net',
  'pagead2.googlesyndication.com',
  '/pagead/',
  '/api/stats/ads',
  '/pcs/activeview',
  'static.doubleclick.net',
  'ad.youtube.com',
  'ads.youtube.com',
  '/ptracking',
  'youtube.com/api/stats/qoe?adformat',
  'google.com/pagead/',
];

export const WebContainer = forwardRef<WebContainerHandle, WebContainerProps>(
  (
    {
      activeTab,
      adBlockEnabled,
      isDesktopMode,
      onAdBlocked,
      onNavStateChange,
      onMediaChange,
    },
    ref
  ) => {
    const youtubeWebRef = useRef<WebView>(null);
    const musicWebRef = useRef<WebView>(null);

    // Initial load indicators (only displayed on cold boot)
    const [isInitialYtReady, setIsInitialYtReady] = useState(false);
    const [isInitialMusicReady, setIsInitialMusicReady] = useState(false);

    // Progress bar states
    const [ytProgress, setYtProgress] = useState(0);
    const [musicProgress, setMusicProgress] = useState(0);
    const [showYtBar, setShowYtBar] = useState(false);
    const [showMusicBar, setShowMusicBar] = useState(false);

    const ytTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const musicTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Track last URL to detect SPA navigations
    const ytLastUrl = useRef('');
    const musicLastUrl = useRef('');

    const currentUserAgent = isDesktopMode
      ? CONFIG.DESKTOP_USER_AGENT
      : CONFIG.MOBILE_USER_AGENT;

    // Full adblock injection script (called once on load, re-injected on SPA nav)
    const adblockScript = useMemo(
      () => getAdblockInjectedCode(adBlockEnabled),
      [adBlockEnabled]
    );

    // Clean up timers on unmount
    useEffect(() => {
      return () => {
        if (ytTimeoutRef.current) clearTimeout(ytTimeoutRef.current);
        if (musicTimeoutRef.current) clearTimeout(musicTimeoutRef.current);
      };
    }, []);

    const startYtProgress = () => {
      setShowYtBar(true);
      setYtProgress(0.25);
      if (ytTimeoutRef.current) clearTimeout(ytTimeoutRef.current);
      ytTimeoutRef.current = setTimeout(() => {
        setShowYtBar(false);
        setIsInitialYtReady(true);
      }, 3500);
    };

    const updateYtProgress = (progress: number) => {
      setYtProgress(progress);
      if (progress >= 1) finishYtProgress();
    };

    const finishYtProgress = () => {
      setYtProgress(1);
      setIsInitialYtReady(true);
      if (ytTimeoutRef.current) clearTimeout(ytTimeoutRef.current);
      setTimeout(() => setShowYtBar(false), 250);
    };

    const startMusicProgress = () => {
      setShowMusicBar(true);
      setMusicProgress(0.25);
      if (musicTimeoutRef.current) clearTimeout(musicTimeoutRef.current);
      musicTimeoutRef.current = setTimeout(() => {
        setShowMusicBar(false);
        setIsInitialMusicReady(true);
      }, 3500);
    };

    const updateMusicProgress = (progress: number) => {
      setMusicProgress(progress);
      if (progress >= 1) finishMusicProgress();
    };

    const finishMusicProgress = () => {
      setMusicProgress(1);
      setIsInitialMusicReady(true);
      if (musicTimeoutRef.current) clearTimeout(musicTimeoutRef.current);
      setTimeout(() => setShowMusicBar(false), 250);
    };

    useImperativeHandle(ref, () => ({
      goBack: () => {
        if (activeTab === 'youtube') youtubeWebRef.current?.goBack();
        else musicWebRef.current?.goBack();
      },
      goForward: () => {
        if (activeTab === 'youtube') youtubeWebRef.current?.goForward();
        else musicWebRef.current?.goForward();
      },
      reload: () => {
        if (activeTab === 'youtube') {
          startYtProgress();
          youtubeWebRef.current?.reload();
        } else {
          startMusicProgress();
          musicWebRef.current?.reload();
        }
      },
      goHome: () => {
        if (activeTab === 'youtube') {
          startYtProgress();
          youtubeWebRef.current?.injectJavaScript(`window.location.href = '${CONFIG.YOUTUBE_URL}'; true;`);
        } else {
          startMusicProgress();
          musicWebRef.current?.injectJavaScript(`window.location.href = '${CONFIG.YOUTUBE_MUSIC_URL}'; true;`);
        }
      },
      loginGoogle: () => {
        const loginUrl = activeTab === 'youtube' ? CONFIG.GOOGLE_LOGIN_URL : CONFIG.GOOGLE_MUSIC_LOGIN_URL;
        if (activeTab === 'youtube') {
          startYtProgress();
          youtubeWebRef.current?.injectJavaScript(`window.location.href = '${loginUrl}'; true;`);
        } else {
          startMusicProgress();
          musicWebRef.current?.injectJavaScript(`window.location.href = '${loginUrl}'; true;`);
        }
      },
      clearCache: () => {
        youtubeWebRef.current?.clearCache?.(true);
        musicWebRef.current?.clearCache?.(true);
        startYtProgress();
        startMusicProgress();
        youtubeWebRef.current?.reload();
        musicWebRef.current?.reload();
      },
      pauseTab: (tab: 'youtube' | 'music') => {
        const script = `
          try {
            var v = document.querySelector('video');
            if (v && !v.paused) v.pause();
          } catch(e) {}
          true;
        `;
        if (tab === 'youtube') youtubeWebRef.current?.injectJavaScript(script);
        else musicWebRef.current?.injectJavaScript(script);
      },
      play: () => {
        const activeRef = activeTab === 'youtube' ? youtubeWebRef : musicWebRef;
        activeRef.current?.injectJavaScript('window.__ytMediaPlay?.(); true;');
      },
      pause: () => {
        const activeRef = activeTab === 'youtube' ? youtubeWebRef : musicWebRef;
        activeRef.current?.injectJavaScript('window.__ytMediaPause?.(); true;');
      },
      togglePlayPause: () => {
        const activeRef = activeTab === 'youtube' ? youtubeWebRef : musicWebRef;
        activeRef.current?.injectJavaScript('window.__ytMediaToggle?.(); true;');
      },
      nextTrack: () => {
        const activeRef = activeTab === 'youtube' ? youtubeWebRef : musicWebRef;
        activeRef.current?.injectJavaScript('window.__ytMediaNext?.(); true;');
      },
      previousTrack: () => {
        const activeRef = activeTab === 'youtube' ? youtubeWebRef : musicWebRef;
        activeRef.current?.injectJavaScript('window.__ytMediaPrev?.(); true;');
      },
    }));

    const handleMessage = useCallback((event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (
          data.type === 'AD_BLOCKED_NETWORK' ||
          data.type === 'AD_STRIPPED_PLAYER' ||
          data.type === 'VIDEO_AD_SKIPPED' ||
          data.type === 'SKIP_BUTTON_CLICKED'
        ) {
          onAdBlocked();
        } else if (data.type === 'MEDIA_METADATA') {
          onMediaChange?.({
            title: data.title || '',
            artist: data.artist || '',
            artwork: data.artwork || '',
            isPlaying: true,
            tab: activeTab,
          });
        } else if (data.type === 'MEDIA_PLAY_STATE') {
          onMediaChange?.({
            title: data.title || '',
            artist: data.artist || '',
            isPlaying: !!data.isPlaying,
            tab: activeTab,
          });
        }
      } catch {
        // Non-JSON message, ignore
      }
    }, [onAdBlocked, onMediaChange, activeTab]);

    const handleNavigationStateChange = useCallback((navState: WebViewNavigation, forTab: 'youtube' | 'music') => {
      if (forTab === activeTab) {
        onNavStateChange({
          canGoBack: navState.canGoBack,
          canGoForward: navState.canGoForward,
          url: navState.url,
        });
      }
      if (!navState.loading) {
        if (forTab === 'youtube') finishYtProgress();
        else finishMusicProgress();
      }

      // *** KEY FIX: Re-inject adblock on SPA navigations ***
      // YouTube uses History API for page transitions — injectedJavaScript only runs once.
      // We detect URL changes and re-inject the adblock loop to cover new videos.
      if (adBlockEnabled && navState.url) {
        const lastUrlRef = forTab === 'youtube' ? ytLastUrl : musicLastUrl;
        const webRef = forTab === 'youtube' ? youtubeWebRef : musicWebRef;

        if (navState.url !== lastUrlRef.current) {
          lastUrlRef.current = navState.url;
          // Reset the ad blocker state and re-run the full injection
          webRef.current?.injectJavaScript(AD_REINJECT_JS + adblockScript);
        }
      }
    }, [activeTab, adBlockEnabled, adblockScript, onNavStateChange]);

    // Block ad URLs at the WebView request level
    const handleShouldStartLoad = useCallback((request: { url: string }) => {
      const url = request.url.toLowerCase();

      // Block intent/app scheme URLs
      if (
        url.startsWith('intent:') ||
        url.startsWith('vnd.youtube:') ||
        url.startsWith('market:') ||
        url.startsWith('play.google.com')
      ) {
        return false;
      }

      // Block ad network URLs at the request level
      if (adBlockEnabled) {
        for (const pattern of AD_URL_PATTERNS) {
          if (url.includes(pattern)) {
            onAdBlocked();
            return false;
          }
        }
      }

      return true;
    }, [adBlockEnabled, onAdBlocked]);

    return (
      <View style={styles.container}>
        {/* Sleek Non-Blocking Top Progress Bar */}
        {showYtBar && activeTab === 'youtube' && (
          <View style={styles.progressBarTrack} pointerEvents="none">
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(100, Math.max(10, Math.round(ytProgress * 100)))}%`,
                  backgroundColor: CONFIG.THEME.primary,
                },
              ]}
            />
          </View>
        )}
        {showMusicBar && activeTab === 'music' && (
          <View style={styles.progressBarTrack} pointerEvents="none">
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(100, Math.max(10, Math.round(musicProgress * 100)))}%`,
                  backgroundColor: CONFIG.THEME.musicAccent,
                },
              ]}
            />
          </View>
        )}

        {/* YouTube WebView */}
        <View
          style={[
            styles.webviewWrapper,
            activeTab === 'youtube' ? styles.visible : styles.hidden,
          ]}
          pointerEvents={activeTab === 'youtube' ? 'auto' : 'none'}
        >
          <WebView
            ref={youtubeWebRef}
            source={{ uri: CONFIG.YOUTUBE_URL }}
            userAgent={currentUserAgent}
            style={styles.webview}
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            domStorageEnabled={true}
            javaScriptEnabled={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            allowsBackForwardNavigationGestures={true}
            setSupportMultipleWindows={false}
            pullToRefreshEnabled={true}
            cacheEnabled={true}
            injectedJavaScriptBeforeContentLoaded={ADBLOCK_PRELOAD_JS}
            injectedJavaScript={adblockScript}
            onMessage={handleMessage}
            onShouldStartLoadWithRequest={handleShouldStartLoad}
            onLoadStart={startYtProgress}
            onLoadProgress={({ nativeEvent }) => updateYtProgress(nativeEvent.progress)}
            onLoadEnd={finishYtProgress}
            onError={finishYtProgress}
            onHttpError={finishYtProgress}
            onNavigationStateChange={(navState) =>
              handleNavigationStateChange(navState, 'youtube')
            }
          />
          {!isInitialYtReady && activeTab === 'youtube' && (
            <View style={styles.initialLoadingOverlay} pointerEvents="none">
              <ActivityIndicator size="large" color={CONFIG.THEME.primary} />
            </View>
          )}
        </View>

        {/* YouTube Music WebView */}
        <View
          style={[
            styles.webviewWrapper,
            activeTab === 'music' ? styles.visible : styles.hidden,
          ]}
          pointerEvents={activeTab === 'music' ? 'auto' : 'none'}
        >
          <WebView
            ref={musicWebRef}
            source={{ uri: CONFIG.YOUTUBE_MUSIC_URL }}
            userAgent={currentUserAgent}
            style={styles.webview}
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            domStorageEnabled={true}
            javaScriptEnabled={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            allowsBackForwardNavigationGestures={true}
            setSupportMultipleWindows={false}
            pullToRefreshEnabled={true}
            cacheEnabled={true}
            injectedJavaScriptBeforeContentLoaded={ADBLOCK_PRELOAD_JS}
            injectedJavaScript={adblockScript}
            onMessage={handleMessage}
            onShouldStartLoadWithRequest={handleShouldStartLoad}
            onLoadStart={startMusicProgress}
            onLoadProgress={({ nativeEvent }) => updateMusicProgress(nativeEvent.progress)}
            onLoadEnd={finishMusicProgress}
            onError={finishMusicProgress}
            onHttpError={finishMusicProgress}
            onNavigationStateChange={(navState) =>
              handleNavigationStateChange(navState, 'music')
            }
          />
          {!isInitialMusicReady && activeTab === 'music' && (
            <View style={styles.initialLoadingOverlay} pointerEvents="none">
              <ActivityIndicator size="large" color={CONFIG.THEME.musicAccent} />
            </View>
          )}
        </View>
      </View>
    );
  }
);

WebContainer.displayName = 'WebContainer';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CONFIG.THEME.background,
  },
  progressBarTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'transparent',
    zIndex: 99,
  },
  progressBarFill: {
    height: 3,
    borderRadius: 1.5,
  },
  webviewWrapper: {
    ...StyleSheet.absoluteFill,
  },
  webview: {
    flex: 1,
    backgroundColor: CONFIG.THEME.background,
  },
  visible: {
    opacity: 1,
    zIndex: 1,
  },
  hidden: {
    opacity: 0,
    zIndex: 0,
  },
  initialLoadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: CONFIG.THEME.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});
