import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { HeaderBar } from '../components/HeaderBar';
import { NavigationBar } from '../components/NavigationBar';
import { SettingsModal } from '../components/SettingsModal';
import { WebContainer, WebContainerHandle } from '../components/WebContainer';
import { CONFIG } from '../constants/config';

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<'youtube' | 'music'>('youtube');
  const [adBlockEnabled, setAdBlockEnabled] = useState(true);
  const [autoSkipAds, setAutoSkipAds] = useState(true);
  const [backgroundAudio, setBackgroundAudio] = useState(true);
  const [isDesktopMode, setIsDesktopMode] = useState(false);
  const [adBlockCount, setAdBlockCount] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [navState, setNavState] = useState<{
    canGoBack: boolean;
    canGoForward: boolean;
    url: string;
  }>({
    canGoBack: false,
    canGoForward: false,
    url: CONFIG.YOUTUBE_URL,
  });

  const webContainerRef = useRef<WebContainerHandle>(null);

  // Handle Android hardware back button
  useEffect(() => {
    const onBackPress = () => {
      if (isSettingsOpen) {
        setIsSettingsOpen(false);
        return true;
      }
      if (navState.canGoBack) {
        webContainerRef.current?.goBack();
        return true;
      }
      return false;
    };

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSubscription.remove();
  }, [navState.canGoBack, isSettingsOpen]);

  const handleAdBlocked = useCallback(() => {
    setAdBlockCount((prev) => prev + 1);
  }, []);

  const handleTabChange = (newTab: 'youtube' | 'music') => {
    if (newTab !== activeTab) {
      // Pause inactive tab so both don't play simultaneously
      webContainerRef.current?.pauseTab(activeTab);
      setActiveTab(newTab);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <HeaderBar
        activeTab={activeTab}
        adBlockCount={adBlockCount}
        adBlockEnabled={adBlockEnabled}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLoginPress={() => webContainerRef.current?.loginGoogle()}
        onToggleAdBlock={() => setAdBlockEnabled((prev) => !prev)}
      />

      {/* Main Web Views (Persistent Dual WebView) */}
      <View style={styles.webContainerWrapper}>
        <WebContainer
          ref={webContainerRef}
          activeTab={activeTab}
          adBlockEnabled={adBlockEnabled}
          isDesktopMode={isDesktopMode}
          onAdBlocked={handleAdBlocked}
          onNavStateChange={setNavState}
        />
      </View>

      {/* Bottom Controls & Tab Switcher */}
      <NavigationBar
        activeTab={activeTab}
        canGoBack={navState.canGoBack}
        canGoForward={navState.canGoForward}
        isDesktopMode={isDesktopMode}
        onTabChange={handleTabChange}
        onGoBack={() => webContainerRef.current?.goBack()}
        onGoForward={() => webContainerRef.current?.goForward()}
        onReload={() => webContainerRef.current?.reload()}
        onGoHome={() => webContainerRef.current?.goHome()}
        onToggleDesktopMode={() => setIsDesktopMode((prev) => !prev)}
      />

      {/* Settings & Controls Modal */}
      <SettingsModal
        visible={isSettingsOpen}
        adBlockEnabled={adBlockEnabled}
        autoSkipAds={autoSkipAds}
        backgroundAudio={backgroundAudio}
        desktopMode={isDesktopMode}
        blockedCount={adBlockCount}
        onClose={() => setIsSettingsOpen(false)}
        onToggleAdBlock={setAdBlockEnabled}
        onToggleAutoSkip={setAutoSkipAds}
        onToggleBackgroundAudio={setBackgroundAudio}
        onToggleDesktopMode={setIsDesktopMode}
        onResetCount={() => setAdBlockCount(0)}
        onLoginGoogle={() => {
          setIsSettingsOpen(false);
          webContainerRef.current?.loginGoogle();
        }}
        onClearCache={() => {
          setIsSettingsOpen(false);
          webContainerRef.current?.clearCache();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CONFIG.THEME.background,
  },
  webContainerWrapper: {
    flex: 1,
  },
});
