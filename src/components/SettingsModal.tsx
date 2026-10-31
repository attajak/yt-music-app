import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from "react-native";
import { CONFIG } from "../constants/config";

interface SettingsModalProps {
  visible: boolean;
  adBlockEnabled: boolean;
  autoSkipAds: boolean;
  backgroundAudio: boolean;
  desktopMode: boolean;
  blockedCount: number;
  onClose: () => void;
  onToggleAdBlock: (val: boolean) => void;
  onToggleAutoSkip: (val: boolean) => void;
  onToggleBackgroundAudio: (val: boolean) => void;
  onToggleDesktopMode: (val: boolean) => void;
  onResetCount: () => void;
  onLoginGoogle: () => void;
  onClearCache: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  adBlockEnabled,
  autoSkipAds,
  backgroundAudio,
  desktopMode,
  blockedCount,
  onClose,
  onToggleAdBlock,
  onToggleAutoSkip,
  onToggleBackgroundAudio,
  onToggleDesktopMode,
  onResetCount,
  onLoginGoogle,
  onClearCache,
}) => {
  const handleClearCacheConfirm = () => {
    Alert.alert(
      "Clear Cache & Cookies",
      "This will log you out of Google and reload the app. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: onClearCache },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>⚙️ Settings & AdBlock</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollInner}
          >
            {/* AdBlock Stats Box */}
            <View style={styles.statsCard}>
              <View style={styles.statsRow}>
                <View>
                  <Text style={styles.statsNumber}>{blockedCount}</Text>
                  <Text style={styles.statsLabel}>Ads Blocked & Skipped</Text>
                </View>
                <TouchableOpacity
                  style={styles.resetBtn}
                  onPress={onResetCount}
                >
                  <Text style={styles.resetBtnText}>Reset</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Google Sign In Banner */}
            <View style={styles.googleCard}>
              <Text style={styles.cardSectionTitle}>
                🔑 Google Account Sign-In
              </Text>
              <Text style={styles.cardDesc}>
                Log in to sync your playlists, liked songs, subscriptions, and
                history. Using genuine Chrome Mobile User-Agent to safely bypass
                Google WebView restrictions.
              </Text>
              <TouchableOpacity
                style={styles.googleLoginBtn}
                onPress={onLoginGoogle}
              >
                <Text style={styles.googleLoginBtnText}>
                  Sign In with Google
                </Text>
              </TouchableOpacity>
            </View>

            {/* Toggles */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Shield & Playback</Text>

              {/* Master AdBlock */}
              <View style={styles.settingItem}>
                <View style={styles.settingTextGroup}>
                  <Text style={styles.settingName}>Ad Blocker</Text>
                  <Text style={styles.settingDesc}>
                    Block banners, sponsor popups & ad network requests
                  </Text>
                </View>
                <Switch
                  value={adBlockEnabled}
                  onValueChange={onToggleAdBlock}
                  trackColor={{ false: "#3A3A3A", true: "#00E676" }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Auto Skip Ads */}
              <View style={styles.settingItem}>
                <View style={styles.settingTextGroup}>
                  <Text style={styles.settingName}>
                    Fast-Forward & Auto Skip
                  </Text>
                  <Text style={styles.settingDesc}>
                    Auto-skip video ads and fast-forward in-stream commercials
                  </Text>
                </View>
                <Switch
                  value={autoSkipAds}
                  onValueChange={onToggleAutoSkip}
                  trackColor={{ false: "#3A3A3A", true: "#00E676" }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Background Audio */}
              <View style={styles.settingItem}>
                <View style={styles.settingTextGroup}>
                  <Text style={styles.settingName}>
                    Background Audio Playback
                  </Text>
                  <Text style={styles.settingDesc}>
                    Prevent music/video from auto-pausing when switching tabs or
                    screen locks
                  </Text>
                </View>
                <Switch
                  value={backgroundAudio}
                  onValueChange={onToggleBackgroundAudio}
                  trackColor={{ false: "#3A3A3A", true: "#00E676" }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Desktop Mode */}
              <View style={styles.settingItem}>
                <View style={styles.settingTextGroup}>
                  <Text style={styles.settingName}>Desktop Mode</Text>
                  <Text style={styles.settingDesc}>
                    Load full desktop YouTube web interface
                  </Text>
                </View>
                <Switch
                  value={desktopMode}
                  onValueChange={onToggleDesktopMode}
                  trackColor={{ false: "#3A3A3A", true: "#208AEF" }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Privacy & Maintenance */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Maintenance</Text>
              <TouchableOpacity
                style={styles.clearCacheBtn}
                onPress={handleClearCacheConfirm}
              >
                <Text style={styles.clearCacheText}>Clear Cache & Cookies</Text>
              </TouchableOpacity>
            </View>

            {/* App Info */}
            <View style={styles.footerInfo}>
              <Text style={styles.footerText}>
                YouTube & YouTube Music Dual v1.0.0
              </Text>
              <Text style={styles.footerSubText}>
                AdBlock Engine + Background Audio + Google Login Ready
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: CONFIG.THEME.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: CONFIG.THEME.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: CONFIG.THEME.border,
  },
  headerTitle: {
    color: CONFIG.THEME.text,
    fontSize: 18,
    fontWeight: "bold",
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: CONFIG.THEME.textSecondary,
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  scrollInner: {
    paddingVertical: 16,
    gap: 16,
  },
  statsCard: {
    backgroundColor: "#182E1E",
    borderWidth: 1,
    borderColor: "#00E676",
    borderRadius: 12,
    padding: 16,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statsNumber: {
    color: "#00E676",
    fontSize: 32,
    fontWeight: "900",
  },
  statsLabel: {
    color: CONFIG.THEME.text,
    fontSize: 13,
    marginTop: 2,
    fontWeight: "500",
  },
  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
  },
  resetBtnText: {
    color: CONFIG.THEME.textSecondary,
    fontSize: 12,
  },
  googleCard: {
    backgroundColor: CONFIG.THEME.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: CONFIG.THEME.border,
  },
  cardSectionTitle: {
    color: CONFIG.THEME.text,
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 6,
  },
  cardDesc: {
    color: CONFIG.THEME.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  googleLoginBtn: {
    backgroundColor: "#4285F4",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  googleLoginBtnText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  section: {
    backgroundColor: CONFIG.THEME.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: CONFIG.THEME.border,
    gap: 14,
  },
  sectionTitle: {
    color: CONFIG.THEME.textSecondary,
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  settingTextGroup: {
    flex: 1,
    paddingRight: 16,
  },
  settingName: {
    color: CONFIG.THEME.text,
    fontSize: 14,
    fontWeight: "600",
  },
  settingDesc: {
    color: CONFIG.THEME.textSecondary,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  clearCacheBtn: {
    backgroundColor: "rgba(255, 68, 68, 0.1)",
    borderColor: "#FF4444",
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  clearCacheText: {
    color: "#FF6666",
    fontWeight: "600",
    fontSize: 13,
  },
  footerInfo: {
    alignItems: "center",
    paddingVertical: 12,
    gap: 4,
  },
  footerText: {
    color: CONFIG.THEME.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  subFooterText: {
    color: "#666666",
    fontSize: 11,
  },
  footerSubText: {
    color: "#666666",
    fontSize: 11,
  },
});
