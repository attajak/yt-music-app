import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CONFIG } from "../constants/config";

interface HeaderBarProps {
  activeTab: "youtube" | "music";
  adBlockCount: number;
  adBlockEnabled: boolean;
  onOpenSettings: () => void;
  onLoginPress: () => void;
  onToggleAdBlock: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeTab,
  adBlockCount,
  adBlockEnabled,
  onOpenSettings,
  onLoginPress,
  onToggleAdBlock,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 8) }]}>
      <View style={styles.content}>
        {/* Brand & Tab Title */}
        <View style={styles.brandContainer}>
          <View
            style={[
              styles.logoBadge,
              {
                backgroundColor:
                  activeTab === "youtube"
                    ? CONFIG.THEME.primary
                    : CONFIG.THEME.musicAccent,
              },
            ]}
          >
            <Text style={styles.logoBadgeText}>
              {activeTab === "youtube" ? "▶" : "♫"}
            </Text>
          </View>
          <View>
            <Text style={styles.titleText}>
              {activeTab === "youtube" ? "YouTube" : "YouTube Music"}
            </Text>
            <Text style={styles.subText}>Dual Pro Player</Text>
          </View>
        </View>

        {/* Action Controls */}
        <View style={styles.actionsContainer}>
          {/* AdBlock Shield Indicator */}
          <TouchableOpacity
            style={[
              styles.adBlockBadge,
              adBlockEnabled
                ? styles.adBlockBadgeActive
                : styles.adBlockBadgeDisabled,
            ]}
            onPress={onToggleAdBlock}
            activeOpacity={0.7}
          >
            <Text style={styles.adBlockIcon}>
              {adBlockEnabled ? "🛡️" : "⚠️"}
            </Text>
            <Text style={styles.adBlockText}>
              {adBlockEnabled ? `${adBlockCount}` : "OFF"}
            </Text>
          </TouchableOpacity>

          {/* Google Sign-In Quick Button */}
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={onLoginPress}
            activeOpacity={0.7}
          >
            <Text style={styles.loginBtnText}>👤 Login</Text>
          </TouchableOpacity>

          {/* Settings Button */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onOpenSettings}
            activeOpacity={0.7}
          >
            <Text style={styles.iconBtnText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: CONFIG.THEME.background,
    borderBottomWidth: 1,
    borderBottomColor: CONFIG.THEME.border,
  },
  content: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  logoBadgeText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  titleText: {
    color: CONFIG.THEME.text,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  subText: {
    color: CONFIG.THEME.textSecondary,
    fontSize: 10,
    marginTop: -2,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  adBlockBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
    borderWidth: 1,
  },
  adBlockBadgeActive: {
    backgroundColor: "rgba(0, 230, 118, 0.15)",
    borderColor: "#00E676",
  },
  adBlockBadgeDisabled: {
    backgroundColor: "rgba(255, 68, 68, 0.15)",
    borderColor: "#FF4444",
  },
  adBlockIcon: {
    fontSize: 12,
  },
  adBlockText: {
    color: CONFIG.THEME.text,
    fontSize: 11,
    fontWeight: "700",
  },
  loginBtn: {
    backgroundColor: CONFIG.THEME.surfaceHover,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CONFIG.THEME.border,
  },
  loginBtnText: {
    color: CONFIG.THEME.text,
    fontSize: 12,
    fontWeight: "600",
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: CONFIG.THEME.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: CONFIG.THEME.border,
  },
  iconBtnText: {
    fontSize: 15,
  },
});
