# Falah — Privacy Audit Mirror

**Verify our privacy claims yourself.**

This repository is a **public, audit-able mirror** of the privacy-relevant subset of [Falah](https://falahapp.pro/) — a privacy-first Islamic prayer companion shipping on iOS and Android.

We ship the main app from a private repository. We publish *this* repository — the parts that actually determine what data leaves your device — so that anyone can verify our privacy claims independently. You do not have to take our word for it.

## Why this exists

In 2020 a popular Islamic prayer app, Muslim Pro, was caught selling [precise location data](https://www.vice.com/en/article/muslim-app-location-data-military/) to a US defense contractor. Since then, the trust vacuum in this category has been permanent. Every prayer app says "we respect your privacy." Almost none let you check.

We're trying something different: **publish the code, not just the claim.**

If you find anything in this repo that contradicts what our [Privacy Policy](docs/privacy-policy.md) says, [open an issue](https://github.com/SamDev1303/falah-privacy-audit/issues) and we will respond publicly.

## What's in this mirror

| File | What it shows | Why it matters |
|---|---|---|
| [`src/purchases.ts`](src/purchases.ts) | RevenueCat init + premium checks | The ONLY third-party SDK that receives any data when you make a purchase. Limited to anonymised subscriber ID + entitlement status. |
| [`src/locationHelpers.ts`](src/locationHelpers.ts) | Location permission + coordinate handling | Confirms location is processed in-memory on-device. No transmission to our servers. |
| [`src/mosques.ts`](src/mosques.ts) | OpenStreetMap mosque-search query | The one feature that sends approximate coordinates to a third-party (OSM Overpass) — and only when you actively open the mosques screen. |
| [`src/app.config.ts`](src/app.config.ts) | Expo build configuration | Lists every native module included in the binary. Confirms Sentry, PostHog, Firebase Analytics, Mixpanel, Amplitude are absent. |
| [`src/package.json`](src/package.json) | Full dependency tree | Cross-reference against the npm registry to verify which SDKs are actually shipped. |
| [`docs/privacy-policy.md`](docs/privacy-policy.md) | Source-of-truth Privacy Policy | The same document published at https://falahapp.pro/privacy. |

## What this mirror does NOT include

We're transparent about what we're holding back:

- **UI / UX code** — design, screens, navigation, React components (brand IP)
- **Premium content** — Q&A library, story narratives, daily Quran-hadith curation
- **Build / deploy config** — internal CI, EAS profiles, signing keys
- **Anything containing personal data** — there isn't any, because we don't collect it

The privacy promise is *what data leaves your device*. That's what's published here. Everything else is product, not privacy.

## How to verify a specific claim

### "Falah doesn't include analytics or crash reporting"

Open [`src/app.config.ts`](src/app.config.ts) and [`src/package.json`](src/package.json). Search for: `posthog`, `sentry`, `firebase/analytics`, `mixpanel`, `amplitude`, `segment`, `hotjar`. Zero matches.

### "Falah doesn't transmit my location"

Open [`src/locationHelpers.ts`](src/locationHelpers.ts). Trace where the coordinates go. They flow into `expo-location` (on-device) and the `adhan` calculation library (on-device). They are never put on the wire.

The one exception is the optional mosque-search feature — see [`src/mosques.ts`](src/mosques.ts). When (and only when) you open the mosques screen, an approximate bounding box around your location is sent to OpenStreetMap's public Overpass API. This is documented in the Privacy Policy §5.4.

### "Falah doesn't collect personal info via RevenueCat"

Open [`src/purchases.ts`](src/purchases.ts). The only RevenueCat calls in the entire app are `Purchases.configure({ apiKey })`, `Purchases.getCustomerInfo()`, and `Purchases.restorePurchases()`. No customer attributes, no email, no name. The "subscriber identifier" RevenueCat assigns is anonymous to us.

## Update cadence

This mirror is updated alongside each app release:

- **Release schedule**: same day or next-day after a Falah release ships to TestFlight / Play Internal
- **Tag pattern**: `v1.0.0-audit-mirror`, `v1.0.1-audit-mirror`, etc., aligned to app version

If you spot a discrepancy between this mirror and a shipped app version, please open an issue.

## Trust, but verify

We're a small team. We make mistakes. The point of this mirror isn't "we are perfect." The point is: if we ever break the privacy promise — accidentally or otherwise — the proof is in this repo before it's anywhere else, and the community can call it out.

## Contact

- **Privacy questions**: privacy@mykoala.com.au
- **Audit findings**: open a GitHub issue
- **Main app**: https://falahapp.pro/
- **Privacy Policy (canonical, live)**: https://falahapp.pro/privacy

## License

MIT — see [LICENSE](LICENSE). The privacy code is yours to inspect, copy, fork, and adapt for your own apps. We hope it raises the bar for the whole category.
