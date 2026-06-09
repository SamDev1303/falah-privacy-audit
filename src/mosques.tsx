import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Linking,
  Platform,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useShallow } from "zustand/react/shallow";
import { Icon } from "@/components/Icon";
import { EmptyState } from "@/components/design/ui/EmptyState";
import { PrimaryButton } from "@/components/design/ui/PrimaryButton";
import { RouteBackgroundScreen } from "@/components/design/islamic/RouteBackgroundScreen";
import { PrayerMatIllustration, LanternIllustration } from "@/components/design/islamic/SpotIllustrations";
import { useTheme, palette, radius, spacing, text } from "@/components/design/theme";
import {
  MOSQUE_FULL_SEARCH_RADIUS_METERS,
  MOSQUE_FULL_RESULT_GOAL,
  getMosqueSearchMessage,
  searchNearbyMosques,
  openMapsDirections,
  openMosqueSearch,
  type Mosque,
} from "@/lib/mosques";
import { getCurrentLocation } from "@/lib/locationHelpers";
import { usePrayerStore } from "@/store/usePrayerStore";

type LoadState =
  | { kind: "init" }
  | { kind: "permission-denied" }
  | { kind: "loading" }
  | { kind: "error"; title: string; message: string }
  | { kind: "ready"; mosques: Mosque[]; travelDetected: boolean };

type SearchLocation = {
  latitude: number;
  longitude: number;
  city: string;
  countryCode: string;
  source: "gps" | "saved";
};

const LIVE_LOCATION_REFRESH_TIMEOUT_MS = 8_000;

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatSearchRadius(meters: number): string {
  return meters >= 1000 ? `${Math.round(meters / 1000)} km` : `${meters} m`;
}

function hasUsableCoordinates(latitude: number, longitude: number) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    !(latitude === 0 && longitude === 0)
  );
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
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

export default function MosquesScreen() {
  const t = useTheme();
  const p = palette(t);
  const primary = t === "night" ? p.gold : p.emerald;
  const savedLocation = usePrayerStore(
    useShallow((s) => ({
      latitude: s.latitude,
      longitude: s.longitude,
      city: s.city,
      countryCode: s.countryCode,
    })),
  );

  const [state, setState] = useState<LoadState>({ kind: "init" });
  const [refreshing, setRefreshing] = useState(false);
  const [lastLocation, setLastLocation] = useState<SearchLocation | null>(null);
  const requestSeq = useRef(0);

  const getSavedSearchLocation = useCallback((): SearchLocation | null => {
    if (!hasUsableCoordinates(savedLocation.latitude, savedLocation.longitude)) {
      return null;
    }

    return {
      latitude: savedLocation.latitude,
      longitude: savedLocation.longitude,
      city: savedLocation.city || "saved location",
      countryCode: savedLocation.countryCode || "AU",
      source: "saved",
    };
  }, [
    savedLocation.city,
    savedLocation.countryCode,
    savedLocation.latitude,
    savedLocation.longitude,
  ]);

  const getSearchLocation = useCallback(async (preferLiveGps: boolean): Promise<SearchLocation> => {
    const saved = getSavedSearchLocation();
    if (!preferLiveGps && saved) return saved;

    try {
      const location = await withTimeout(
        getCurrentLocation(),
        LIVE_LOCATION_REFRESH_TIMEOUT_MS,
        "Live location lookup timed out",
      );
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        city: location.city,
        countryCode: location.countryCode,
        source: "gps",
      };
    } catch (error) {
      if (saved) return saved;
      throw error;
    }
  }, [getSavedSearchLocation]);

  const fetchMosques = useCallback(async (forceRefresh = false) => {
    const requestId = requestSeq.current + 1;
    requestSeq.current = requestId;
    const isCurrentRequest = () => requestId === requestSeq.current;
    let requestLocation: SearchLocation | null = null;

    if (!forceRefresh) setState({ kind: "loading" });
    try {
      const location = await getSearchLocation(forceRefresh);
      if (!isCurrentRequest()) return;
      requestLocation = location;
      setLastLocation(location);

      const { mosques, travelDetected } = await searchNearbyMosques(
        location.latitude,
        location.longitude,
        location.countryCode,
        MOSQUE_FULL_SEARCH_RADIUS_METERS,
        { forceRefresh, includeFallbackSearch: true, resultGoal: MOSQUE_FULL_RESULT_GOAL },
      );
      if (!isCurrentRequest()) return;
      setState({ kind: "ready", mosques, travelDetected });
    } catch (err) {
      if (!isCurrentRequest()) return;
      if (!requestLocation && !getSavedSearchLocation()) {
        setLastLocation(null);
      }
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg.toLowerCase().includes("permission denied") && !getSavedSearchLocation()) {
        setState({ kind: "permission-denied" });
        return;
      }
      const copy = getMosqueSearchMessage(err);
      setState({ kind: "error", ...copy });
    }
  }, [getSavedSearchLocation, getSearchLocation]);

  useEffect(() => {
    fetchMosques();
    return () => {
      requestSeq.current += 1;
    };
  }, [fetchMosques]);

  const refreshNearby = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchMosques(true);
    } finally {
      setRefreshing(false);
    }
  }, [fetchMosques]);

  const isBusy = state.kind === "init" || state.kind === "loading" || refreshing;

  function openDirections(m: Mosque) {
    const platform: "ios" | "android" = Platform.OS === "ios" ? "ios" : "android";
    void openMapsDirections(m, platform, Linking);
  }

  function openNativeMosqueSearch() {
    if (!lastLocation) return;
    const platform: "ios" | "android" = Platform.OS === "ios" ? "ios" : "android";
    void openMosqueSearch(
      lastLocation.latitude,
      lastLocation.longitude,
      platform,
      Linking,
    );
  }

  return (
    <RouteBackgroundScreen
      screen="mosques"
      theme={t}
      mode="bare"
      scrimStrength={t === "night" ? 0.56 : 0.34}
      overlayOpacity={t === "night" ? 0.1 : 0.08}
    >
      <View style={{ paddingHorizontal: spacing.s5, paddingTop: spacing.s6, paddingBottom: spacing.s3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.s3, marginBottom: spacing.s5 }}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: t === "night" ? "rgba(255,247,223,0.08)" : "rgba(255,249,236,0.72)",
              borderWidth: 1,
              borderColor: p.goldBorder,
            }}
          >
            <Icon name="arrow-left" size={24} color={primary} />
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[text.eyebrow, { color: p.goldSoft }]}>Mosque Finder</Text>
            <Text style={[text.displaySm, { color: p.fgStrong, marginTop: 2 }]}>
              Mosques near you
            </Text>
          </View>
        </View>

        <View
          style={{
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: p.goldBorder,
            backgroundColor: t === "night" ? "rgba(6,17,31,0.66)" : "rgba(255,249,236,0.68)",
            padding: spacing.s5,
          }}
        >
          <Text accessibilityLanguage="ar" style={[text.arabicMd, { color: primary, lineHeight: 42 }]}>
            مساجد
          </Text>
          <Text style={[text.bodyLg, { color: p.fgStrong, fontWeight: "700", marginTop: -2 }]}>
            Local masjid directions
          </Text>
          <Text style={[text.bodySm, { color: p.fgMuted, marginTop: spacing.s1, lineHeight: 20 }]}>
            Search nearby OpenStreetMap results, then open broader live listings in your phone's maps app.
          </Text>
          <View style={{ flexDirection: "row", gap: spacing.s3, marginTop: spacing.s4 }}>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                theme={t}
                label={refreshing ? "Refreshing" : "Refresh nearby"}
                variant="filled"
                size="md"
                loading={refreshing}
                disabled={isBusy}
                leadingIcon={!refreshing ? <Icon name="refresh" size={18} color={t === "night" ? p.bgElev : p.fgStrong} /> : undefined}
                onPress={refreshNearby}
              />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                theme={t}
                label="Open Maps"
                variant="outline"
                size="md"
                disabled={!lastLocation}
                leadingIcon={<Icon name="search" size={18} color={t === "night" ? p.gold : p.goldSoft} />}
                onPress={openNativeMosqueSearch}
              />
            </View>
          </View>
        </View>
        {state.kind === "ready" && state.mosques.length > 0 && (
          <Text style={[text.bodySm, { color: p.fgFaint, marginTop: spacing.s2 }]}>
            OpenStreetMap places within {formatSearchRadius(MOSQUE_FULL_SEARCH_RADIUS_METERS)} · Open Maps for broader live listings
          </Text>
        )}
        {lastLocation?.source === "saved" && (
          <Text style={[text.bodySm, { color: p.fgFaint, marginTop: spacing.s2 }]}>
            Using saved location: {lastLocation.city}
          </Text>
        )}
        {state.kind === "ready" && state.travelDetected && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.s2,
              marginTop: spacing.s3,
              paddingHorizontal: spacing.s3,
              paddingVertical: spacing.s2,
              borderRadius: radius.md,
              backgroundColor: p.gold + "22",
              borderWidth: 1,
              borderColor: p.goldBorder,
            }}
          >
            <Icon name="qibla" size={18} color={p.goldSoft} />
            <Text style={[text.bodySm, { color: p.goldSoft, fontWeight: "600", flex: 1 }]}>
              Travel detected. Review your prayer-time calculation method in Settings.
            </Text>
          </View>
        )}
      </View>

      {state.kind === "init" || state.kind === "loading" ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={primary} />
          <Text className="mt-3 text-sm" style={{ color: p.fgMuted }}>
            Locating nearby mosques…
          </Text>
        </View>
      ) : state.kind === "permission-denied" ? (
        <EmptyState
          theme={t}
          illustration={<PrayerMatIllustration theme={t} size={108} />}
          title="Location permission needed"
          description="Falah uses your location only to find nearby mosques. Grant permission in Settings to see this list."
          actionLabel="Open Settings"
          onAction={() => Linking.openSettings()}
        />
      ) : state.kind === "error" ? (
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: spacing.s5, paddingBottom: spacing.s9 }}>
          <View
            style={{
              borderRadius: radius.xl,
              borderWidth: 1,
              borderColor: p.goldBorder,
              backgroundColor: t === "night" ? "rgba(11,26,46,0.82)" : "rgba(255,249,236,0.84)",
              padding: spacing.s6,
              shadowColor: p.shadow,
              shadowOpacity: t === "night" ? 0.26 : 0.12,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 14 },
            }}
          >
            <View style={{ alignItems: "center" }}>
              <LanternIllustration theme={t} size={92} />
              <Text style={[text.displayXs, { color: p.fgStrong, marginTop: spacing.s3, textAlign: "center" }]}>
                {state.title}
              </Text>
              <Text style={[text.bodyMd, { color: p.fgMuted, marginTop: spacing.s2, textAlign: "center", lineHeight: 23 }]}>
                {state.message}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: spacing.s3, marginTop: spacing.s5 }}>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  theme={t}
                  label="Retry"
                  variant="filled"
                  size="md"
                  onPress={refreshNearby}
                />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  theme={t}
                  label="Open Maps"
                  variant="outline"
                  size="md"
                  disabled={!lastLocation}
                  onPress={openNativeMosqueSearch}
                />
              </View>
            </View>
          </View>
        </View>
      ) : state.mosques.length === 0 ? (
        <EmptyState
          theme={t}
          illustration={<PrayerMatIllustration theme={t} size={108} />}
          title={`No mosques within ${formatSearchRadius(MOSQUE_FULL_SEARCH_RADIUS_METERS)}`}
          description="Pull to refresh, or try increasing the radius later. OSM coverage varies by region."
        />
      ) : (
        <FlatList
          data={state.mosques}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 4 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshNearby} tintColor={primary} />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openDirections(item)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                minHeight: 82,
                paddingVertical: spacing.s3,
                paddingHorizontal: spacing.s4,
                marginBottom: spacing.s2,
                backgroundColor: t === "night" ? "rgba(11,26,46,0.82)" : "rgba(255,249,236,0.78)",
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: p.goldBorder,
                shadowColor: p.shadow,
                shadowOpacity: t === "night" ? 0.22 : 0.1,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 10 },
              }}
              accessibilityLabel={`Open directions to ${item.name}`}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: spacing.s3,
                  backgroundColor: primary + "14",
                  borderWidth: 1,
                  borderColor: p.goldBorder,
                }}
              >
                <Icon name="mosque" size={24} color={primary} />
              </View>
              <View className="flex-1">
                <Text style={[text.bodyLg, { color: p.fgStrong, fontWeight: "700" }]} numberOfLines={2}>
                  {item.name}
                </Text>
                {item.address ? (
                  <Text style={[text.bodySm, { color: p.fgMuted, marginTop: 2 }]} numberOfLines={2}>
                    {item.address}
                  </Text>
                ) : null}
                <Text style={[text.bodySm, { color: primary, fontWeight: "700", marginTop: 2 }]}>
                  {formatDistance(item.distanceMeters)} away
                </Text>
              </View>
              <View style={{ alignItems: "flex-end", marginLeft: spacing.s2 }}>
                <Text style={[text.bodySm, { color: p.goldSoft, fontWeight: "700" }]}>Directions</Text>
                <Icon name="chevron-right" size={20} color={p.fgFaint} />
              </View>
            </Pressable>
          )}
        />
      )}
    </RouteBackgroundScreen>
  );
}
