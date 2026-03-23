# Exposure Logger

Phase 0 foundation for an offline mobile app that logs film exposures by roll.

## Stack

- Expo + React Native + TypeScript
- Expo Router for navigation
- `expo-sqlite` with Drizzle ORM for typed data access
- Jest + React Native Testing Library for baseline test coverage

## Commands

- `npm install`
- `npm run start`
- `npm run android`
- `npm run android:native`
- `npm run ios`
- `npm run ios:native`
- `npm run web`
- `npm run lint`
- `npm run test`

## Native Module Note

Most app development can use Expo Go through `npm run android` or `npm run ios`.

Features backed by native modules that are not included in Expo Go, such as speech recognition, require a native development build:

- `npm run android:native`
- `npm run ios:native`

After the native app is installed once, you can usually return to `npm run start` and open the development build on device.

## Native Android Setup

`npm run android:native` requires a working local Android/Java toolchain.

Checklist:

- Android Studio installed
- Android SDK installed
- `JAVA_HOME` pointed at a valid JDK or Android Studio `jbr`
- Android SDK discoverable through `ANDROID_HOME` or `android/local.properties`

Typical PowerShell session setup:

```powershell
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
$env:Path="$env:JAVA_HOME\bin;$env:Path"
$env:ANDROID_HOME="C:\Users\phucn\AppData\Local\Android\Sdk"
$env:Path="$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:Path"
```

Repository-local SDK path fix for Gradle:

```powershell
@"
sdk.dir=C:\\Users\\phucn\\AppData\\Local\\Android\\Sdk
"@ | Set-Content -Path .\android\local.properties
```

Then run:

```powershell
npm run android:native
```

Notes:

- `npm run android` opens Expo Go and is not enough for custom native modules like speech recognition.
- Most JS or UI changes still use Metro fast refresh after the native app has been built once.

## Conventions

- Route files live under `src/app`
- Database schema and client setup live under `src/db`
- App-facing data uses explicit domain types in `src/types`
- Screens and components should use repositories or services, not direct SQLite access

## Phase 0 Scope

- app shell with stable placeholder routes
- typed database foundation
- linting and formatting config
- baseline test setup
