/**
 * GPS location helpers — get position and reverse geocode to country code
 */

import * as Location from "expo-location";
import { getMethod } from "@/constants/prayers";

export { getMagneticDeclination } from "./wmm";

const LOCATION_PERMISSION_TIMEOUT_MS = 8000;
const CURRENT_POSITION_TIMEOUT_MS = 12000;
const REVERSE_GEOCODE_TIMEOUT_MS = 8000;

export interface LocationResult {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  countryCode: string;
  calculationMethod: number;
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Request location permission and get current position + country info
 */
export async function getCurrentLocation(): Promise<LocationResult> {
  const { status } = await withTimeout(
    Location.requestForegroundPermissionsAsync(),
    LOCATION_PERMISSION_TIMEOUT_MS,
    "Location permission request timed out"
  );
  if (status !== "granted") {
    throw new Error("Location permission denied");
  }

  const position = await withTimeout(
    Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    }),
    CURRENT_POSITION_TIMEOUT_MS,
    "Location lookup timed out"
  );

  const { latitude, longitude } = position.coords;

  // Reverse geocode to get country
  const [geocode] = await withTimeout(
    Location.reverseGeocodeAsync({ latitude, longitude }),
    REVERSE_GEOCODE_TIMEOUT_MS,
    "Location reverse geocode timed out"
  );

  const city = geocode?.city ?? geocode?.subregion ?? "Unknown";
  const country = geocode?.country ?? "Unknown";
  const countryCode = geocode?.isoCountryCode ?? "AU";

  return {
    latitude,
    longitude,
    city,
    country,
    countryCode,
    calculationMethod: getMethod(countryCode),
  };
}

export const KAABA_COORDINATES = {
  // QiblaWeb/LatLong and adhan-js all land within a few meters of this point.
  latitude: 21.422487,
  longitude: 39.826206,
} as const;

export function normalizeDegrees(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

export function shortestSignedDelta(from: number, to: number): number {
  return ((to - from + 540) % 360) - 180;
}

export function calculateQiblaCompassRotation(qiblaBearing: number, trueHeading: number): number {
  return shortestSignedDelta(trueHeading, qiblaBearing);
}

/**
 * Calculate Qibla bearing from current position to Kaaba.
 * Returns degrees from true north, clockwise.
 */
export function calculateQiblaBearing(
  latitude: number,
  longitude: number
): number {
  const KAABA_LAT = KAABA_COORDINATES.latitude;
  const KAABA_LNG = KAABA_COORDINATES.longitude;

  const lat1 = (latitude * Math.PI) / 180;
  const lat2 = (KAABA_LAT * Math.PI) / 180;
  const dLng = ((KAABA_LNG - longitude) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = normalizeDegrees(bearing);

  return bearing;
}
