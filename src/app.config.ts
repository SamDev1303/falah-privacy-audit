import type { ExpoConfig } from "expo/config";

const APP_ENV = process.env.EXPO_PUBLIC_APP_ENV ?? "development";

const config: ExpoConfig = {
  name: "Falah — فَلَح",
  slug: "falah",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  scheme: "falah",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#0E5C3A",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.falah.app",
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "Falah needs your location to calculate accurate prayer times for your area.",
      // Background modes:
      // - 'fetch' refreshes prayer times silently every 12 hours
      // - 'remote-notification' delivers the Prayer Focus modal trigger
      // 'audio' was dropped 2026-05-03 per Neo review — `playsInSilentModeIOS: true`
      // in lib/adhanAudio.ts handles foreground silent-mode playback without
      // needing the App Store-flagged background-audio capability.
      UIBackgroundModes: ["fetch", "remote-notification"],
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: "com.falah.app",
    adaptiveIcon: {
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
      backgroundColor: "#0E5C3A",
    },
    permissions: [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "RECEIVE_BOOT_COMPLETED",
      "VIBRATE",
      "WAKE_LOCK",
      // USE_FULL_SCREEN_INTENT dropped 2026-05-03 per Gideon review — the
      // V2 "Prayer Focus" pattern uses a regular foreground modal, not the
      // full-screen-intent system that has 30-40% Play Store rejection risk
      // since Jan-2025 policy update.
      "SCHEDULE_EXACT_ALARM",
    ],
  },
  plugins: [
    "expo-router",
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Falah needs your location to calculate prayer times.",
        isAndroidBackgroundLocationEnabled: false,
      },
    ],
    [
      "expo-notifications",
      {
        color: "#0E5C3A",
        defaultChannel: "prayer-times",
        sounds: [
          "./assets/audio/adhan_mishary.mp3",
          "./assets/audio/adhan_makkah.mp3",
          // W3: 4 Public Domain reciters from archive.org/details/adhan.notifications.
          // Trimmed to 30s mono 22kHz 32kbps (~118KB each).
          "./assets/audio/adhan_sudais.mp3",
          "./assets/audio/adhan_diyanet.mp3",
          "./assets/audio/adhan_hudhaify.mp3",
          "./assets/audio/adhan_basit.mp3",
        ],
      },
    ],
    "expo-sensors",
    "expo-background-fetch",
    "expo-font",
    "expo-localization",
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    appEnv: APP_ENV,
    eas: {
      projectId:
        process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
        "6c704aef-95b4-45ed-987f-3120db6c9381",
    },
  },
};

export default config;
