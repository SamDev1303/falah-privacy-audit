# Privacy Policy — Falah App

**Last updated:** 9 June 2026  
**Effective version:** 1.1.x (premium / Falah Pro tier)  
**Data controller:** Mykoala Pty Ltd (Australia)

> **What changed in this version.** Earlier versions of this policy described Falah as a fully account-free, zero-network app with no diagnostics. As of the V1.1 premium tier that is no longer complete. Falah's *core* experience is still local-first and account-free, but the optional **Falah Pro** tier now adds **email magic-link sign-in (Supabase)**, and **production builds include crash + sampled performance diagnostics (Sentry)**. Both are disclosed in full below. We updated this policy rather than leave a flattering-but-stale version in place.

---

## 1. Who We Are

Falah is a Muslim prayer companion app developed and published by **Mykoala Pty Ltd**, an Australian company trading as Mykoala. In this Privacy Policy, "we", "us" and "our" refer to Mykoala Pty Ltd.

If you have any questions about how we handle your data, please contact us at **privacy@mykoala.com.au**.

---

## 2. Our Core Privacy Commitment

Falah is built local-first: **the core app — prayer times, Qibla, notifications, and free content — runs entirely on your device, needs no account, and sends none of your personal data to servers we operate.**

We do not create user profiles, we do not track you across apps or websites, we do not sell data, and we do not share data with advertisers or data brokers.

Two optional, clearly-bounded exceptions exist and are disclosed in detail below:

1. **Falah Pro (premium)** uses an **email magic-link** sign-in via Supabase to unlock premium content. Only your email and entitlement state are involved — see §3.4 and §5.5.
2. **Production builds include Sentry** for crash + sampled performance diagnostics, **not linked to your identity** — see §3.5 and §5.6.

This is not a marketing claim — it is verifiable. Falah's privacy-relevant code is published as an open-source audit mirror at [github.com/SamDev1303/falah-privacy-audit](https://github.com/SamDev1303/falah-privacy-audit). You do not have to take our word for it.

---

## 3. What We Collect

### 3.1 On-Device Data (never transmitted to us)

All core app data is stored exclusively on your device using secure local storage (react-native-mmkv). We cannot access it; it is not synced to any cloud service we operate.

| Data | Purpose | Location |
|------|---------|----------|
| Location coordinates | Calculate prayer times and Qibla direction | Device only — used in-memory, not written to persistent storage unless you grant persistent access |
| Hijri calendar preference | Display Islamic dates correctly | MMKV local storage |
| Theme preference (light/dark) | Remember your display choice | MMKV local storage |
| Prayer streak counter | Track your consistency across sessions | MMKV local storage |
| Prayer time calculation preferences | Store your chosen calculation method and madhab | MMKV local storage |
| Notification preferences | Remember which adhans and reminders you have enabled | MMKV local storage |

### 3.2 Location Data

We request access to your device location to calculate accurate prayer times and Qibla direction. Specifically:

- Location is processed on-device using the `adhan` calculation library.
- Coordinates are **never transmitted to servers we operate** — we operate none that receive location.
- The **one** outbound exception is the optional **nearby-mosque** feature: when you open that screen, an approximate bounding box around your location is sent to the **OpenStreetMap Overpass API** (§5.4). This happens only on that screen, only when you open it.
- If you deny location permission, the app asks you to set your location manually.
- We do not access location in the background beyond what iOS/Android require to deliver scheduled adhan notifications.

### 3.3 Purchase Data

If you purchase a Falah subscription or lifetime plan, the transaction is processed by Apple (App Store) or Google (Google Play). We receive confirmation via RevenueCat — an **anonymised subscriber identifier** plus your entitlement status. It does not include your name, payment method, or other identifying information (§5.1).

### 3.4 Email Address (premium / Falah Pro only)

If you choose to unlock **Falah Pro**, you sign in with an **email magic link** handled by **Supabase Auth** (§5.5). In that case:

- Your **email address** is collected for the sole purpose of sending the sign-in link and looking up your premium entitlement.
- There is **no password**. We do not add you to any marketing list and do not share your email with third parties.
- Your email is linked, within Supabase, to your premium entitlement state and a Supabase-generated user ID.
- The **core app does not require sign-in** — if you never use Falah Pro, no email is ever collected.

### 3.5 Diagnostics (production builds only)

As of **V1.1.5**, production builds include **Sentry** (`@sentry/react-native`) for stability:

- **Crash data** — uncaught exceptions and React render errors, with stack traces and default device context (OS version, device model). Source maps are uploaded at build time so traces de-minify.
- **Performance data** — a **5%-sampled** subset of transaction/timing traces (`tracesSampleRate: 0.05`).
- **Not linked to your identity** — `Sentry.setUser` is never called; no email, user ID, location, or purchase data is attached to events.
- **Production only** — gated on `EXPO_PUBLIC_APP_ENV === "production"`; development builds send nothing to Sentry.

### 3.6 Content Requests

When you open the Quran screen, Falah fetches the requested Quran content from **`api.alquran.cloud`** (§5.7). These are standard content reads and are not linked by us to any user account.

---

## 4. What We Do NOT Collect

To be explicit, Falah does **not** collect:

- **No passwords.** Premium sign-in is passwordless (email magic link only).
- **No names, phone numbers, or physical addresses.**
- **No contacts, calendar data, or photos.** We do not request access to these device features.
- **No advertising identifiers (IDFA/GAID)** and **no advertising SDKs.**
- **No product / usage analytics.** Falah does not include PostHog, Firebase Analytics, Mixpanel, Amplitude, Segment, or any equivalent behavioural-analytics SDK. (Crash + 5%-sampled performance **diagnostics** are collected in production via Sentry — see §3.5 — and are not linked to your identity.)
- **No cross-app or cross-site tracking**, and we do not sell or share data with data brokers.
- **No biometric or health data.**
- **No precise movement history.** Location is used for the current calculation (and the optional mosque search) only.
- **No server-side copy of your prayer history, streaks, preferences, saved city, or notification settings** — those live only on your device.

> The core app remains **account-free**. Only the optional Falah Pro tier involves an email address (§3.4). If you don't use premium, Falah holds no personal identifier for you at all.

---

## 5. Third-Party Services and Their Privacy Policies

Falah integrates a small number of third-party services. Each is listed below with what data flows to it and a link to its own policy.

### 5.1 RevenueCat (Radar Labs Inc., Delaware, USA)

Processes subscription purchases and manages entitlements on our behalf. Receives the purchase receipt from Apple/Google and assigns an anonymised subscriber ID. Does not receive your location, email, prayer preferences, or streak data. Data is limited to the **Purchase History** category.

Privacy policy: [https://www.revenuecat.com/privacy](https://www.revenuecat.com/privacy)

### 5.2 Apple App Store

If you download on iOS, Apple processes your App Store transaction subject to Apple's own privacy policy.

Privacy policy: [https://www.apple.com/legal/privacy/](https://www.apple.com/legal/privacy/)

### 5.3 Google Play

If you download on Android, Google processes your Play Store transaction subject to Google's own privacy policy.

Privacy policy: [https://policies.google.com/privacy](https://policies.google.com/privacy)

### 5.4 OpenStreetMap / Overpass API

To display nearby mosques, Falah queries the OpenStreetMap Overpass API with your approximate coordinates **only when you open the mosques screen**. The query carries no personally identifying information. OpenStreetMap is a community-operated open-data project.

Privacy policy: [https://wiki.osmfoundation.org/wiki/Privacy_Policy](https://wiki.osmfoundation.org/wiki/Privacy_Policy)

### 5.5 Supabase (premium / Falah Pro only)

If you use Falah Pro, **Supabase** provides email magic-link authentication and gates premium media. It receives your **email address** (for the magic link and entitlement lookup) and issues a user ID and session token (JWT). Premium media streams through a Supabase **Edge Function** that proxies files from private Cloudflare R2 storage — **the app holds no R2 credentials**, and premium downloads carry no user-identifying data beyond the entitlement-validating JWT. Supabase does not receive your location, prayer preferences, or streak data.

Privacy policy: [https://supabase.com/privacy](https://supabase.com/privacy)

### 5.6 Sentry (Functional Software, Inc. dba Sentry, USA)

In **production builds only**, Sentry receives crash diagnostics and a 5%-sampled subset of performance traces (§3.5). Events carry stack traces and default device context but are **not linked to your identity** (`Sentry.setUser` is never called). Used solely for crash diagnosis and stability; not used for advertising or tracking.

Privacy policy: [https://sentry.io/privacy/](https://sentry.io/privacy/)

### 5.7 Quran Content API (alquran.cloud)

When you open the Quran screen, Falah reads the requested content from `api.alquran.cloud`. The request is a standard content fetch and is not linked by us to any user account.

Privacy policy: [https://alquran.cloud/](https://alquran.cloud/)

---

## 6. Children's Privacy

Falah is rated 4+ on the App Store and Everyone on Google Play. It contains no content inappropriate for children, displays no advertising, and is not directed at children under 13. The core app collects no personal information; the optional premium tier collects only an email address from the account holder. Parents and guardians may use the app with or on behalf of children consistent with the on-device-first data model described above.

---

## 7. Data Security

The core app transmits no personal data to servers we operate, so there is no server-side breach vector for it. Local data is protected by your device's own security mechanisms (iOS Secure Enclave / Android Keystore where applicable, and MMKV's local file encryption).

For Falah Pro, your email and entitlement state are held by Supabase under its own security controls; authentication uses short-lived session tokens, and we store no password because sign-in is passwordless.

You can delete all on-device app data at any time by uninstalling Falah.

---

## 8. Data Retention

On-device data is retained entirely under your control — uninstalling removes it. We retain no server-side records of your core app data because we receive none.

- **RevenueCat** retains your anonymised subscriber identifier for the lifetime of your subscription plus a reasonable period for dispute resolution.
- **Supabase** (premium users) retains your email + entitlement record for as long as your account exists; you may request deletion (see §9).
- **Sentry** retains diagnostic events per its own retention schedule; events are not linked to your identity.

---

## 9. Your Rights

Depending on your jurisdiction, you may have rights with respect to your personal data. For the core app we hold no personal data about you; for Falah Pro we hold only your email + entitlement state, and we respect these rights in full.

### 9.1 Australian Privacy Act 1988 (Cth)

If you are located in Australia, the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs) apply to the extent we handle your personal information. For the core app we hold none; for Falah Pro, APP 12 (access) and APP 13 (correction) requests regarding your email/entitlement can be met by contacting us.

**Statutory tort for serious invasions of privacy.** The statutory tort under the Privacy Act 1988 (Cth) commenced 10 June 2025. Falah's data minimisation (no core-app personal data; email-only for premium) limits exposure; we acknowledge this protection is in force for Australian residents.

**Automated decision-making (ADM) disclosure.** ADM transparency requirements commence 10 December 2026. Falah's prayer-time calculations are deterministic astronomical computations — not "automated decisions" within the meaning of the Act. We do not use AI, machine learning, or profiling to make decisions about users producing legal or similarly significant effects.

**Data deletion requests.** To delete on-device data, uninstall the app. To delete the anonymised RevenueCat subscriber identifier, or your Falah Pro email/entitlement record held by Supabase, email **privacy@mykoala.com.au** from (or naming) the email used; we will action and pass on the request within 5 business days. Apple and Google purchase records follow their own retention policies.

### 9.2 General Data Protection Regulation (GDPR)

If you are in the EU/EEA, to the extent GDPR applies you have the right to access, rectify, erase, restrict, and port your personal data, and to object to processing. For the core app we hold no personal data — exercise these by deleting the app. For Falah Pro, contact us at privacy@mykoala.com.au (or Supabase directly) to exercise rights over your email/entitlement record.

### 9.3 California Consumer Privacy Act (CCPA)

If you are a California resident, you have rights under the CCPA including the right to know, the right to delete, and the right not to be sold. We do **not** sell personal information. The core app collects none; Falah Pro collects only an email for sign-in/entitlement. Contact privacy@mykoala.com.au with any request.

---

## 10. Changes to This Policy

We update this policy when the app materially changes how it handles data. This V1.1 update reflects the addition of the premium tier (email magic-link sign-in via Supabase) and production crash/performance diagnostics (Sentry). We update the "Last updated" date at the top and, for material changes, surface an in-app notice.

---

## 11. Contact

If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:

**Email:** privacy@mykoala.com.au  
**Website:** [https://mykoala.com.au](https://mykoala.com.au)  
**Postal address:** Mykoala Pty Ltd, Australia *(full street address will be added once registered)*

We aim to respond to all privacy enquiries within 30 days.

---

*Falah — Prayer times, Quran, and Qibla for Muslims everywhere.*
