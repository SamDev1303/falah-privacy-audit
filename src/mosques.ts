/**
 * Mosque finder — OpenStreetMap Overpass API wrapper.
 *
 * Travel-mode detection compares the current GPS country code against
 * the last-known country code in MMKV. When they differ, returns
 * `travelDetected: true` so the UI can surface a banner.
 */

import { createMMKV } from "react-native-mmkv";
import type { Mosque } from "@/lib/types/mosque";

export type { Mosque } from "@/lib/types/mosque";

const travelStore = createMMKV({ id: "falah-travel" });
const LAST_COUNTRY_KEY = "travel.lastCountryCode";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

export interface MosqueSearchResult {
  mosques: Mosque[];
  travelDetected: boolean;
  newCountryCode: string | null;
}

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat?: number;
    lon?: number;
  };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

const EARTH_RADIUS_M = 6_371_000;

function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

function formatAddress(tags: Record<string, string> | undefined): string {
  if (!tags) return "";
  if (tags["addr:full"]) return tags["addr:full"];

  return [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"],
    tags["addr:city"],
    tags["addr:state"],
    tags["addr:postcode"],
  ]
    .filter(Boolean)
    .join(", ");
}

function normalizeOverpassResponse(
  json: OverpassResponse,
  originLatitude: number,
  originLongitude: number,
): Mosque[] {
  return (json.elements ?? [])
    .map((element): Mosque | null => {
      const latitude = element.lat ?? element.center?.lat;
      const longitude = element.lon ?? element.center?.lon;

      if (latitude === undefined || longitude === undefined) {
        return null;
      }

      return {
        id: `${element.type}/${element.id}`,
        name: element.tags?.name ?? "Unnamed mosque",
        address: formatAddress(element.tags),
        latitude,
        longitude,
        distanceMeters: haversine(
          originLatitude,
          originLongitude,
          latitude,
          longitude,
        ),
        rating: null,
        ratingCount: null,
        photoRef: null,
        openNow: null,
      };
    })
    .filter((mosque): mosque is Mosque => mosque !== null)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

/**
 * Detects whether the user has entered a new country since last call.
 * Returns the new country code if changed, null otherwise. Caller is
 * responsible for prompting the user about updated mosques + prayer
 * calculation method.
 */
export function detectTravel(currentCountryCode: string): {
  travelDetected: boolean;
  previousCountryCode: string | null;
} {
  const prev = travelStore.getString(LAST_COUNTRY_KEY) ?? null;
  if (prev === null) {
    travelStore.set(LAST_COUNTRY_KEY, currentCountryCode);
    return { travelDetected: false, previousCountryCode: null };
  }
  if (prev !== currentCountryCode) {
    travelStore.set(LAST_COUNTRY_KEY, currentCountryCode);
    return { travelDetected: true, previousCountryCode: prev };
  }
  return { travelDetected: false, previousCountryCode: prev };
}

/**
 * Find mosques within `radiusMeters` of the given coordinates using
 * OpenStreetMap Overpass. Results are sorted by computed distance.
 */
export async function findNearbyMosques(
  lat: number,
  lng: number,
  radiusMeters: number = 5000,
): Promise<Mosque[]> {
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${lat},${lng});
      way["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${lat},${lng});
      relation["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${lat},${lng});
    );
    out center;
  `;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);
  let res: Response;
  try {
    res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "User-Agent": "Falah/1.0 (https://falahapp.pro)",
      },
      body: query,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Overpass: ${res.status}${text ? ` ${text}` : ""}`);
  }

  const json: OverpassResponse = await res.json();
  return normalizeOverpassResponse(json, lat, lng);
}

export async function searchNearbyMosques(
  latitude: number,
  longitude: number,
  countryCode: string,
  radiusMeters: number = 5000,
): Promise<MosqueSearchResult> {
  const travel = detectTravel(countryCode);
  const mosques = await findNearbyMosques(latitude, longitude, radiusMeters);

  return {
    mosques,
    travelDetected: travel.travelDetected,
    newCountryCode: travel.travelDetected ? countryCode : null,
  };
}

/**
 * Build a Maps deeplink for navigating to a mosque. Uses Google Maps URL
 * scheme on Android, Apple Maps fallback on iOS via `maps://` URL.
 */
export function getMapsUrl(mosque: Mosque, platform: "ios" | "android"): string {
  if (platform === "ios") {
    return `maps://?daddr=${mosque.latitude},${mosque.longitude}&q=${encodeURIComponent(mosque.name)}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${mosque.latitude},${mosque.longitude}`;
}
