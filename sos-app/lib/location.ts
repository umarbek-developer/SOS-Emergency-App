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

export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
        { headers: { "Accept-Language": "en" } },
      );
      if (!res.ok) return null;
      const data = await res.json() as {
        address?: Record<string, string>;
        display_name?: string;
      };
      const a = data.address ?? {};
      const parts: string[] = [];
      if (a.house_number && a.road) parts.push(`${a.house_number} ${a.road}`);
      else if (a.road) parts.push(a.road);
      const sub = a.suburb ?? a.neighbourhood ?? a.district;
      if (sub) parts.push(sub);
      const city = a.city ?? a.town ?? a.village;
      if (city) parts.push(city);
      return parts.length > 0 ? parts.join(", ") : (data.display_name ?? null);
    } catch {
      return null;
    }
  }

  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
    if (!place) return null;
    const parts: string[] = [];
    if (place.streetNumber && place.street) parts.push(`${place.streetNumber} ${place.street}`);
    else if (place.street) parts.push(place.street);
    if (place.district) parts.push(place.district);
    else if (place.subregion) parts.push(place.subregion);
    if (place.city) parts.push(place.city);
    return parts.filter(Boolean).join(", ") || null;
  } catch {
    return null;
  }
}

export function watchLocation(callback: (fix: LocationFix) => void): () => void {
  if (Platform.OS === "web") {
    if (typeof navigator === "undefined" || !navigator.geolocation) return () => {};
    const id = navigator.geolocation.watchPosition(
      (pos) =>
        callback({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
        }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }

  let cancelled = false;
  let subscription: Location.LocationSubscription | null = null;

  (async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (cancelled || status !== "granted") return;
    const sub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 10 },
      (loc) => {
        if (!cancelled) {
          callback({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy ?? null,
          });
        }
      },
    );
    if (cancelled) sub.remove();
    else subscription = sub;
  })().catch(() => {});

  return () => {
    cancelled = true;
    subscription?.remove();
  };
}
