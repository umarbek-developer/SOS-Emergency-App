# SOS — Emergency Help

A mobile emergency SOS app built with Expo (React Native).
Single big SOS button, 6 emergency types, trusted contacts, GPS sharing,
health profile, and configurable settings. Frontend-only — all data is stored
locally on device with AsyncStorage.

## Requirements

- Node.js 20+ ([download](https://nodejs.org))
- npm (bundled with Node) or pnpm/yarn if you prefer
- For mobile testing: the **Expo Go** app on your phone
  - iOS: <https://apps.apple.com/app/expo-go/id982107779>
  - Android: <https://play.google.com/store/apps/details?id=host.exp.exponent>

## Run it locally

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm start
```

This starts the Expo dev server and prints a QR code in the terminal.

- **iPhone:** open the Camera app and point it at the QR code → tap the
  notification to open in Expo Go.
- **Android:** open Expo Go and scan the QR code from inside the app.
- **Web preview:** press `w` in the terminal, or run `npm run web`.

## Project structure

```
app/                    Expo Router screens
  (tabs)/               Bottom-tab routes (home, circle, profile, settings)
  _layout.tsx           Root layout with providers and overlay
assets/                 App icon
components/             Reusable UI components
constants/              Color palette
contexts/               AppContext (state + AsyncStorage persistence)
hooks/                  useColors hook
lib/                    Helpers (calling, location)
types.ts                Shared TypeScript types
app.json                Expo configuration (name, icons, permissions)
```

## Type checking

```bash
npm run typecheck
```

## Building for production

For a native release build (requires an [Expo account](https://expo.dev) and
EAS CLI):

```bash
npm install -g eas-cli
eas login
eas build --platform ios       # or --platform android
```

For a hosted web build:

```bash
npx expo export --platform web
```

## Notes

- **Direct calling on Android** uses the `CALL_PHONE` permission and the
  `ACTION_CALL` intent so emergency numbers ring immediately.
- **iOS** always shows its own "Call?" confirmation — this is enforced by
  Apple and cannot be bypassed by any third-party app.
- All data (contacts, profile, settings) lives only on the device. There is
  no backend or cloud sync.
