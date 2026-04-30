import * as Location from "expo-location";
import { Platform } from "react-native";

export interface LocationFix {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export async function getCurrentLocation(): Promise<LocationFix | null> {
  if (Platform.OS === "web") {
    return new Promise((resolve) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy ?? null,
          }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 30000 },
      );
    });
  }

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return null;
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      accuracy: loc.coords.accuracy ?? null,
    };
  } catch {
    return null;
  }
}

export function formatCoords(fix: LocationFix | null): string {
  if (!fix) return "Location unavailable";
  return `${fix.latitude.toFixed(5)}, ${fix.longitude.toFixed(5)}`;
}

export function mapsUrl(fix: LocationFix): string {
  return `https://maps.google.com/?q=${fix.latitude},${fix.longitude}`;
}
