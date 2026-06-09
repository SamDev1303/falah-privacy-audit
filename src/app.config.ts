import type { ExpoConfig } from "expo/config";

const APP_ENV = process.env.EXPO_PUBLIC_APP_ENV ?? "development";

const config: ExpoConfig = {
  name: "Falah — فَلَح",
  slug: "falah",
  version: "1.2.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  scheme: "falah",
  jsEngine: "hermes",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#0E5C3A",
  },
  ios: {
    // V1 ships iPhone-only (locked Sam decision D-iPad 2026-05-06).
    // iPad screenshots not produced for V1; restore supportsTablet=true in
    // v1.0.1 polish once iPad set is generated (2048×2732 @ 8 captures).
    supportsTablet: false,
    bundleIdentifier: "app.falah.mobile",
    // Phase 4.7 — App Store-required Apple Sign In capability per CONTEXT §2.
    // Triggered by the matching plugin entry registered below in plugins[].
    usesAppleSignIn: true,
    // #9 SACRED CORE — Time-Sensitive Notifications capability lets the adhan
    // break through Focus/DND (paired with interruptionLevel:'timeSensitive' in
    // lib/prayerScheduler.ts). Auto-managed by EAS — no Apple approval form.
    // DEFERRED: com.apple.developer.usernotifications.critical-alerts is what
    // rings through the HARDWARE silent switch, but it needs Apple to approve a
    // request form first; adding it here before approval breaks code-signing.
    // After Apple grants it: add it here AND flip ADHAN_INTERRUPTION_LEVEL to
    // 'critical' in prayerScheduler.ts. (Verify EAS build syncs this capability.)
    entitlements: {
      "com.apple.developer.usernotifications.time-sensitive": true,
    },
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
    // Apple Privacy Manifest (SDK 51+). Canonical surface — generated
    // ios/Falah/PrivacyInfo.xcprivacy is gitignored and rebuilt from this on
    // every `expo prebuild`/EAS build, so the manifest must live here.
    //
    // NSPrivacyAccessedAPITypes mirrors the four required-reason APIs Expo +
    // RN runtime touch (file timestamps, UserDefaults, disk space, boot time).
    // Reason codes verified against Apple's required-reason API catalog —
    // see ios/Falah/PrivacyInfo.xcprivacy pre-patch state for the originals.
    //
    // NSPrivacyCollectedDataTypes per Gideon round-2 §4 (2026-05-21):
    //   - email + userID + purchaseHistory are LINKED (tied to the Supabase/
    //     RevenueCat user record via auth + IAP), used for AppFunctionality.
    //   - preciseLocation is UNLINKED (client-side prayer-time math only,
    //     never stored against the user account server-side).
    //   - none are used for tracking (NSPrivacyTracking:false below).
    // Must match the App Store Connect Privacy Nutrition questionnaire.
    privacyManifests: {
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryFileTimestamp",
          NSPrivacyAccessedAPITypeReasons: ["C617.1", "0A2A.1", "3B52.1"],
        },
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
          NSPrivacyAccessedAPITypeReasons: ["CA92.1", "C56D.1"],
        },
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryDiskSpace",
          NSPrivacyAccessedAPITypeReasons: ["E174.1", "85F4.1"],
        },
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategorySystemBootTime",
          NSPrivacyAccessedAPITypeReasons: ["35F9.1"],
        },
      ],
      NSPrivacyTracking: false,
      NSPrivacyTrackingDomains: [],
      NSPrivacyCollectedDataTypes: [
        {
          NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeEmailAddress",
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            "NSPrivacyCollectedDataTypePurposeAppFunctionality",
          ],
        },
        {
          NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeUserID",
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            "NSPrivacyCollectedDataTypePurposeAppFunctionality",
          ],
        },
        {
          NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypePurchaseHistory",
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            "NSPrivacyCollectedDataTypePurposeAppFunctionality",
          ],
        },
        {
          NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypePreciseLocation",
          NSPrivacyCollectedDataTypeLinked: false,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            "NSPrivacyCollectedDataTypePurposeAppFunctionality",
          ],
        },
      ],
    },
  },
  android: {
    // RevenueCat Android app (project 093278ba) and Google Play Console
    // existing entry both use com.claudeking.falah (different from iOS bundle).
    // Confirmed from Sam's credentials report 2026-05-06.
    package: "com.claudeking.falah",
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
      // #9 SACRED CORE — exact alarms so the adhan fires on time, not Doze-batched.
      // USE_EXACT_ALARM = the alarm-class permission (auto-granted, no user prompt)
      // for Android 13+; a prayer-times app qualifies under Play's alarm/calendar
      // policy (needs a Play Console declaration). POST_NOTIFICATIONS (13+) is
      // required to show any notification at all.
      "USE_EXACT_ALARM",
      "POST_NOTIFICATIONS",
    ],
  },
  plugins: [
    "expo-router",
    "expo-asset",
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
        defaultChannel: "prayer-times-silent",
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
    "expo-background-task",
    "expo-font",
    "expo-localization",
    // Phase 4f iter-6 — expo-secure-store wraps Supabase session tokens with
    // hardware-backed key storage (Keychain on iOS, Keystore on Android) per
    // OWASP MASVS L2. See lib/encryptedStorage.ts for the adapter that bridges
    // Supabase's `storage` interface to AES-CTR-encrypted AsyncStorage with the
    // AES key held in SecureStore.
    "expo-secure-store",
    // Phase 4.7 — Apple Sign In plugin (paired with ios.usesAppleSignIn=true above)
    "expo-apple-authentication", // CONTEXT §2 LOCKED
    // Reversed-client-id is non-secret per Google OAuth spec (lands in iOS bundle URL schemes).
    [
      "@react-native-google-signin/google-signin",
      {
        iosUrlScheme: "com.googleusercontent.apps.750518175847-ippnba4na7338vncmsplf8h748jf0qjh",
      },
    ],
    // V1.1.5 — Sentry config plugin. Drives the production source-map upload at
    // EAS build time (uses SENTRY_AUTH_TOKEN from EAS secrets + org/project below).
    // org/project default to the Falah Sentry project but stay env-overridable.
    [
      "@sentry/react-native",
      {
        url: "https://sentry.io/",
        organization: process.env.SENTRY_ORG ?? "clean-up-bros-iz",
        project: process.env.SENTRY_PROJECT ?? "falah",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  // Phase 6 iter-6 EAS Update wiring (2026-05-12) — auto-added when EAS Build
  // installed expo-updates package on first iOS production build attempt.
  // URL is the EAS Update channel root for this project; runtime version
  // pins updates to matching app.version, ensuring no over-the-air JS update
  // ever lands on a binary it wasn't compiled for.
  updates: {
    url: "https://u.expo.dev/6c704aef-95b4-45ed-987f-3120db6c9381",
  },
  runtimeVersion: {
    policy: "appVersion",
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
