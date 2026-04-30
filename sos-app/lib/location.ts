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
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
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
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`,
        { headers: { "User-Agent": "SOS-Emergency-App/1.0" } },
      );
      if (!res.ok) return null;
      const data = await res.json() as {
        address?: Record<string, string>;
        display_name?: string;
      };
      const a = data.address ?? {};
      const parts: string[] = [];
      // Street
      if (a.road) {
        parts.push(a.house_number ? `${a.house_number} ${a.road}` : a.road);
      } else if (a.pedestrian) {
        parts.push(a.pedestrian);
      }
      // Kvartal (quarter field; format as "X-kvartal" when Nominatim gives a bare number)
      if (a.quarter) {
        const kv = /^\d+$/.test(a.quarter.trim()) ? `${a.quarter}-kvartal` : a.quarter;
        parts.push(kv);
      }
      // Dom number — only relevant when there is no named street (kvartal-style address)
      if (!a.road && a.house_number) {
        parts.push(`dom ${a.house_number}`);
      }
      // Neighbourhood / suburb / district (skip if same text as quarter)
      const nb = a.neighbourhood ?? a.suburb ?? a.city_district ?? a.district;
      if (nb && nb !== a.quarter) parts.push(nb);
      // City
      const city = a.city ?? a.town ?? a.municipality ?? a.village ?? a.county;
      if (city) parts.push(city);
      if (parts.length > 0) return parts.join(", ");
      // Fallback: use display_name but strip postal code and country
      if (data.display_name) {
        const segments = data.display_name.split(", ");
        const trimmed = segments
          .filter((s) => !/^\d{4,}$/.test(s.trim()))
          .slice(0, -1);
        return trimmed.slice(0, 3).join(", ") || data.display_name;
      }
      return null;
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
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
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
