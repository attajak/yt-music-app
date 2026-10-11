import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CONFIG } from '../constants/config';

interface NavigationBarProps {
  activeTab: 'youtube' | 'music';
  canGoBack: boolean;
  canGoForward: boolean;
  isDesktopMode: boolean;
  onTabChange: (tab: 'youtube' | 'music') => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onReload: () => void;
  onGoHome: () => void;
  onToggleDesktopMode: () => void;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  activeTab,
  canGoBack,
  canGoForward,
  isDesktopMode,
  onTabChange,
  onGoBack,
  onGoForward,
  onReload,
  onGoHome,
  onToggleDesktopMode,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {/* Browser Controls Toolbar */}
      <View style={styles.webControlsRow}>
        <TouchableOpacity
          style={[styles.webCtrlBtn, !canGoBack && styles.webCtrlBtnDisabled]}
          onPress={onGoBack}
          disabled={!canGoBack}
          activeOpacity={0.6}
        >
          <Text style={[styles.webCtrlText, !canGoBack && styles.webCtrlTextDisabled]}>◀</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.webCtrlBtn, !canGoForward && styles.webCtrlBtnDisabled]}
          onPress={onGoForward}
          disabled={!canGoForward}
          activeOpacity={0.6}
        >
          <Text style={[styles.webCtrlText, !canGoForward && styles.webCtrlTextDisabled]}>▶</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.webCtrlBtn} onPress={onReload} activeOpacity={0.6}>
          <Text style={styles.webCtrlText}>↻</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.webCtrlBtn} onPress={onGoHome} activeOpacity={0.6}>
          <Text style={styles.webCtrlText}>⌂</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.webCtrlBtn, isDesktopMode && styles.webCtrlBtnActive]}
          onPress={onToggleDesktopMode}
          activeOpacity={0.6}
        >
          <Text style={styles.webCtrlText}>{isDesktopMode ? '💻' : '📱'}</Text>
        </TouchableOpacity>
      </View>

      {/* Main Tab Switcher */}
      <View style={styles.tabBar}>
        {/* YouTube Tab */}
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'youtube' && styles.tabButtonActive]}
          onPress={() => onTabChange('youtube')}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.tabIconCircle,
              activeTab === 'youtube' && { backgroundColor: CONFIG.THEME.primary },
            ]}
          >
            <Text style={styles.tabIconText}>▶</Text>
          </View>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'youtube' && { color: '#FFFFFF', fontWeight: 'bold' },
            ]}
          >
            YouTube
          </Text>
        </TouchableOpacity>

        {/* YouTube Music Tab */}
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'music' && styles.tabButtonActive]}
          onPress={() => onTabChange('music')}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.tabIconCircle,
              activeTab === 'music' && { backgroundColor: CONFIG.THEME.musicAccent },
            ]}
          >
            <Text style={styles.tabIconText}>♫</Text>
          </View>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'music' && { color: '#FFFFFF', fontWeight: 'bold' },
            ]}
          >
            Music
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: CONFIG.THEME.background,
    borderTopWidth: 1,
    borderTopColor: CONFIG.THEME.border,
  },
  webControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    backgroundColor: '#141414',
  },
  webCtrlBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  webCtrlBtnActive: {
    backgroundColor: '#2A2A2A',
  },
  webCtrlBtnDisabled: {
    opacity: 0.3,
  },
  webCtrlText: {
    color: CONFIG.THEME.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  webCtrlTextDisabled: {
    color: CONFIG.THEME.textSecondary,
  },
  tabBar: {
    flexDirection: 'row',
    height: 54,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    opacity: 0.6,
  },
  tabButtonActive: {
    opacity: 1,
  },
  tabIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabLabel: {
    color: CONFIG.THEME.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
});
