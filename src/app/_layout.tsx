import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LogBox } from "react-native";
import { CONFIG } from "../constants/config";

// Ignore benign warning about remote push notifications in Expo Go
// Local notifications (media playback controls) remain fully functional
LogBox.ignoreLogs([
  "[expo-notifications] Push notifications (remote notifications) are unavailable in Expo Go",
]);

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: CONFIG.THEME.background },
          animation: 'none',
        }}
      />
    </SafeAreaProvider>
  );
}
