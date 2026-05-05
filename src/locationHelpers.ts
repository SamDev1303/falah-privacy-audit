/**
 * GPS location helpers — get position and reverse geocode to country code
 */

import * as Location from "expo-location";
import { getMethod } from "@/constants/prayers";

export { getMagneticDeclination } from "./wmm";

export interface LocationResult {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  countryCode: string;
  calculationMethod: number;
}

/**
 * Request location permission and get current position + country info
 */
export async function getCurrentLocation(): Promise<LocationResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Location permission denied");
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const { latitude, longitude } = position.coords;

  // Reverse geocode to get country
  const [geocode] = await Location.reverseGeocodeAsync({ latitude, longitude });

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

/**
 * Calculate Qibla bearing from current position to Kaaba
 * Returns degrees from True North (clockwise)
 */
export function calculateQiblaBearing(
  latitude: number,
  longitude: number
): number {
  const KAABA_LAT = 21.4225;
  const KAABA_LNG = 39.8262;

  const lat1 = (latitude * Math.PI) / 180;
  const lat2 = (KAABA_LAT * Math.PI) / 180;
  const dLng = ((KAABA_LNG - longitude) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = (bearing + 360) % 360;

  return bearing;
}
