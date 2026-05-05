/**
 * RevenueCat integration — monetization layer
 * Handles SDK init, premium status checks, and purchase restoration.
 *
 * --- PRIVACY AUDIT NOTE ----------------------------------------------------
 * This file is published in falah-privacy-audit (public mirror) so users can
 * inspect EXACTLY how purchases are handled. The version that ships to
 * production has the same logic; only the SDK keys differ.
 *
 * Why the keys are not redacted in the SHIPPED app:
 * RevenueCat distinguishes between PUBLIC SDK keys (intended to be embedded
 * in client binaries — `appl_*` for iOS, `goog_*` for Android) and SECRET
 * server-side keys (never embedded, only used by backend services). SDK
 * keys identify which RevenueCat project to talk to — they do not
 * authenticate. Anyone who downloads the .ipa or .aab can extract them in
 * seconds via standard tooling. Embedding them is the documented pattern.
 *
 * In this AUDIT MIRROR we use environment-variable placeholders so the
 * file remains useful as a code-quality reference even after production keys
 * change. See https://www.revenuecat.com/docs/projects/api-keys for the
 * full RevenueCat security model.
 * --------------------------------------------------------------------------
 */

import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { Platform } from "react-native";

// RevenueCat PUBLIC SDK keys (project: proj6b6cc8df)
// Production values are embedded in the shipped binary as standard practice.
// In this audit mirror we read from env so the file works as a clean reference.
const RC_IOS_KEY = process.env.EXPO_PUBLIC_RC_IOS_KEY ?? "appl_*** (set in build env)";
const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? "goog_*** (set in build env)";

/**
 * Initialize RevenueCat SDK. Call once at app startup.
 * Gracefully no-ops if keys are placeholders (dev mode).
 */
export async function initRevenueCat(): Promise<void> {
  const key = Platform.OS === "ios" ? RC_IOS_KEY : RC_ANDROID_KEY;

  // Skip init only if somehow empty
  if (!key || key.length < 10) {
    if (__DEV__) console.log("[Purchases] Skipping init — no key configured");
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
 *
 * PRIVACY: getCustomerInfo() asks RevenueCat for the entitlement status of
 * the anonymised subscriber identifier RevenueCat assigned to this device.
 * No personal info is sent or received here.
 */
export async function checkPremiumStatus(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active["premium"] !== undefined;
  } catch {
    return false;
  }
}

/**
 * Restore previous purchases (for "Restore Purchases" button).
 * Returns updated premium status.
 *
 * PRIVACY: Asks RevenueCat to look up purchases tied to the App Store /
 * Play account on the device. Does not transmit user-identifying info to
 * us — the App Store / Play Store handle the receipt verification.
 */
export async function restorePurchases(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo.entitlements.active["premium"] !== undefined;
  } catch {
    return false;
  }
}
