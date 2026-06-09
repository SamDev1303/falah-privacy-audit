# Falah — Privacy Audit Mirror

**Verify our privacy claims yourself.**

This repository is a **public, audit-able mirror** of the privacy-relevant subset of [Falah](https://falahapp.pro/) — a privacy-first Islamic prayer companion shipping on iOS and Android.

We ship the main app from a private repository. We publish *this* repository — the parts that actually determine what data leaves your device — so that anyone can verify our privacy claims independently. You do not have to take our word for it.

> **Last refreshed:** 9 June 2026, aligned to Falah **V1.1.x** (the premium / Falah Pro tier). This mirror is kept honest, not flattering: where the app changed what it does, this document changed with it. See [What changed since V1.0.0](#what-changed-since-v100) below.

## Why this exists

In 2020 a popular Islamic prayer app, Muslim Pro, was caught selling [precise location data](https://www.vice.com/en/article/muslim-app-location-data-military/) to a US defense contractor. Since then, the trust vacuum in this category has been permanent. Every prayer app says "we respect your privacy." Almost none let you check.

We're trying something different: **publish the code, not just the claim** — including the parts that are *less* flattering. Falah is local-first, but it is not zero-network: the optional premium tier adds an email sign-in, and production builds include crash diagnostics. Both are documented here and in the [Privacy Policy](docs/privacy-policy.md), because hiding them would defeat the entire point of this repo.

If you find anything in this repo that contradicts what our [Privacy Policy](docs/privacy-policy.md) says, [open an issue](https://github.com/SamDev1303/falah-privacy-audit/issues) and we will respond publicly.

## What's in this mirror

| File | What it shows | Why it matters |
|---|---|---|
| [`src/purchases.ts`](src/purchases.ts) | RevenueCat init + premium checks | Receives an anonymised subscriber ID + entitlement status when you buy. No name, email, or attributes attached. The RevenueCat key is read from an env var, never hardcoded. |
| [`src/locationHelpers.ts`](src/locationHelpers.ts) | Location permission + coordinate handling | Confirms location is processed in-memory on-device for prayer-time + Qibla math. Not transmitted to any server we operate. |
| [`src/mosques.tsx`](src/mosques.tsx) | Nearby-mosque screen + OpenStreetMap query | The one feature that sends approximate coordinates to a third party (OSM Overpass) — and only when you actively open the mosques screen. |
| [`src/app.config.ts`](src/app.config.ts) | Expo build configuration | Lists the native modules + config plugins in the binary. Confirms **PostHog, Firebase Analytics, Mixpanel, Amplitude, Segment are absent**, and shows the diagnostics SDK that **is** present: **Sentry** (production-only). |
| [`src/package.json`](src/package.json) | Full dependency tree | Cross-reference against the npm registry to verify exactly which SDKs ship — including `@sentry/react-native`, `react-native-purchases`, and `@supabase/supabase-js`. |
| [`docs/privacy-policy.md`](docs/privacy-policy.md) | Source-of-truth Privacy Policy | The same document published at https://falahapp.pro/privacy. |

## What this mirror does NOT include

We're transparent about what we're holding back:

- **UI / UX code** — design, screens, navigation, React components (brand IP). (The mosques screen is included because it makes the one outbound-location call.)
- **Premium content** — Q&A library, story narratives, daily Quran-hadith curation
- **Build / deploy config** — internal CI, EAS profiles, signing keys, Supabase Edge Function source
- **Secrets** — no API keys, tokens, or DSNs are published here; client keys are read from env vars at build time

## How to verify a specific claim

### "Falah includes no advertising or usage analytics — and discloses the diagnostics it does run"

Open [`src/app.config.ts`](src/app.config.ts) and [`src/package.json`](src/package.json). Search for `posthog`, `firebase/analytics`, `mixpanel`, `amplitude`, `segment`, `hotjar` → **zero matches**. There is no advertising SDK and no product/usage-analytics SDK.

Now search for `sentry` → **you will find it**, and that is deliberate. As of **V1.1.5**, production builds include **Sentry** (`@sentry/react-native`) for crash diagnostics + a 5%-sampled subset of performance traces. It is gated on `EXPO_PUBLIC_APP_ENV === "production"` (dev builds never send), and `Sentry.setUser` is **never** called — crash events carry stack traces + default device context (OS version, device model) but are **not linked to your identity**. Disclosed in Privacy Policy §3.5 / §5.6.

### "Falah doesn't transmit my location to our servers"

Open [`src/locationHelpers.ts`](src/locationHelpers.ts). Coordinates flow into `expo-location` (on-device) and the `adhan` calculation library (on-device). They are not put on the wire to any server we operate.

The one exception is the optional mosque-search feature — see [`src/mosques.tsx`](src/mosques.tsx). When (and only when) you open the mosques screen, an approximate bounding box around your location is POSTed to OpenStreetMap's public Overpass API. Documented in Privacy Policy §5.4.

### "Falah doesn't collect personal info via RevenueCat"

Open [`src/purchases.ts`](src/purchases.ts). The only RevenueCat calls are `Purchases.configure({ apiKey })`, entitlement reads, and `restorePurchases()`. No customer attributes, no email, no name. The subscriber identifier RevenueCat assigns is anonymous to us.

### "The core app is account-free; premium sign-in is optional and email-only"

Falah's core experience (prayer times, Qibla, notifications, free content) needs **no account** and collects no email. The optional **Falah Pro** tier uses an **email magic-link** sign-in via **Supabase Auth** to unlock premium content — that email is used only to send the magic link and to look up your entitlement. No password, no marketing list, no third-party sharing. Disclosed in Privacy Policy §3.4 / §5.5.

## What changed since V1.0.0

Honesty log — the privacy-material changes between the original V1.0.0 mirror (May 2026) and this refresh:

- **+ Sentry** crash + 5%-sampled performance diagnostics, **production builds only**, not linked to identity (V1.1.5).
- **+ Email magic-link accounts (Supabase Auth)** for the optional premium tier — the core app stays account-free.
- **+ Premium media streaming** via a Supabase Edge Function that proxies Cloudflare R2 (the app holds no R2 credentials).
- **+ Quran content** fetched on demand from `api.alquran.cloud` when you open the Quran screen.

The earlier mirror stated "no accounts, no email, no crash reporting." That was true for V1.0.0 and is **no longer accurate** — this refresh corrects it. That correction is the system working as intended.

## Update cadence

- **Schedule**: refreshed alongside each app release that changes privacy-relevant behaviour (same-day / next-day after it ships).
- **Tag pattern**: `v1.1.x-audit-mirror`, aligned to app version.

If you spot a discrepancy between this mirror and a shipped app version, please open an issue.

## Trust, but verify

We're a small team. We make mistakes — this very mirror sat on V1.0.0 claims after the app had moved on, until we caught it and published this correction. The point isn't "we are perfect." The point is: when the privacy promise changes, the proof changes here, in public, and the community can hold us to it.

## Contact

- **Privacy questions**: privacy@mykoala.com.au
- **Audit findings**: open a GitHub issue
- **Main app**: https://falahapp.pro/
- **Privacy Policy (canonical, live)**: https://falahapp.pro/privacy

## License

MIT — see [LICENSE](LICENSE). The privacy code is yours to inspect, copy, fork, and adapt for your own apps. We hope it raises the bar for the whole category.
