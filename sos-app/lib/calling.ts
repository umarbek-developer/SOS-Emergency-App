import * as IntentLauncher from "expo-intent-launcher";
import { Linking, PermissionsAndroid, Platform } from "react-native";

/**
 * Place a phone call. Returns the number string so callers can display
 * it as a fallback (e.g. on web where tel: opens whatever the OS has
 * registered — possibly a video-call app instead of the phone dialer).
 * Returns null if a native call was dispatched.
 */
export async function placeCall(phone: string): Promise<string | null> {
  const number = phone.replace(/\s+/g, "");
  if (!number) return null;

  // On web, try tel: (works on mobile browsers and some desktop apps like FaceTime/Skype).
  // Return the number so the UI can show it as a visible fallback.
  if (Platform.OS === "web") {
    Linking.openURL(`tel:${number}`).catch(() => {});
    return number;
  }

  if (Platform.OS === "android") {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CALL_PHONE,
        {
          title: "Call permission",
          message:
            "Allow the app to place emergency calls directly without an extra confirmation.",
          buttonPositive: "Allow",
          buttonNegative: "Not now",
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        await IntentLauncher.startActivityAsync("android.intent.action.CALL", {
          data: `tel:${number}`,
        });
        return null;
      }
    } catch {
      // fall through to dialer fallback
    }
  }

  try {
    await Linking.openURL(`tel:${number}`);
  } catch {
    // ignore
  }
  return null;
}
