/**
 * RevenueCat integration — monetization layer
 * Handles SDK init, premium status checks, and purchase restoration.
 *
 * @greptile-review-pass 2026-05-11 — entitlement state SoT for the mobile
 * client. Review for:
 *   - SEC-01 key handling (EXPO_PUBLIC_RC_*_KEY env-only, never hardcoded)
 *   - Entitlement string "Falah Pro" must match RC dashboard exactly
 *   - checkPremiumStatus + restorePurchases free-tier fallback on any error
 */

import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { Platform } from "react-native";

// RevenueCat SDK keys — read from .env.local at bundle time (gitignored)
// `EXPO_PUBLIC_*` prefix REQUIRED — Metro injects only these into the client bundle.
// Live values mirrored from ~/Desktop/api/Falah/KEYS.md ## RevenueCat section.
// SEC-01 (P1) — see lib/purchases.ts:11-12 commit history for source-code migration log.
const RC_IOS_KEY = process.env.EXPO_PUBLIC_RC_IOS_KEY ?? "";
const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? "";
const FORCE_PREMIUM_FOR_TESTING =
  __DEV__ && process.env.EXPO_PUBLIC_FORCE_PREMIUM_FOR_TESTING === "1";

/**
 * Initialize RevenueCat SDK. Call once at app startup.
 * Gracefully no-ops if keys are placeholders (dev mode).
 */
export async function initRevenueCat(): Promise<void> {
  const key = Platform.OS === "ios" ? RC_IOS_KEY : RC_ANDROID_KEY;

  // M4: validate the key and make a misconfigured PRODUCTION build observable.
  // RC keys are prefixed appl_ (iOS) / goog_ (Android) and are well over 10
  // chars. Previously a short/empty key only logged under __DEV__, so a broken
  // prod build silently dropped every user to free tier with zero telemetry.
  const expectedPrefix = Platform.OS === "ios" ? "appl_" : "goog_";
  const keyLooksValid = !!key && key.length >= 10 && key.startsWith(expectedPrefix);
  if (!keyLooksValid) {
    // console.warn surfaces in production logs (Sentry breadcrumb / device log),
    // unlike the prior __DEV__-only console.log.
    console.warn(
      `[Purchases] RevenueCat ${Platform.OS} key missing/invalid (expected '${expectedPrefix}…') — skipping init; users will see FREE tier. Check EXPO_PUBLIC_RC_${Platform.OS === "ios" ? "IOS" : "ANDROID"}_KEY in the build env.`,
    );
    return;
  }

  try {
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    await Purchases.configure({ apiKey: key });
    if (__DEV__) console.log("[Purchases] Initialized");
  } catch (err) {
    if (__DEV__) console.error("[Purchases] Init failed:", err);
  }
}

/**
 * Check if current user has active premium entitlement.
 * Returns false gracefully on any error (free tier fallback).
 */
// RC entitlement identifier is permanent once created (RC dashboard does not
// allow rename). Exact string from dashboard: "Falah Pro" (capital F, capital
// P, single space). REST API ID: entl67c87620d0.
const ENTITLEMENT_ID = "Falah Pro";

export async function checkPremiumStatus(): Promise<boolean> {
  if (FORCE_PREMIUM_FOR_TESTING) {
    if (__DEV__) console.log("[Purchases] Premium forced for local testing");
    return true;
  }

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch {
    return false;
  }
}

/**
 * Restore previous purchases (for "Restore Purchases" button).
 * Returns updated premium status.
 */
export async function restorePurchases(): Promise<boolean> {
  if (FORCE_PREMIUM_FOR_TESTING) {
    if (__DEV__) console.log("[Purchases] Restore forced premium for local testing");
    return true;
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch {
    return false;
  }
}
