# Deployment Guide

## Overview

This document covers local development setup for native builds and the current release workflow for Expo Application Services (EAS).

## Commands

- `npm install`
- `npm run start`
- `npm run android`
- `npm run android:native`
- `npm run ios`
- `npm run ios:native`
- `npm run build:android`
- `npm run build:ios`
- `npm run submit:android`
- `npm run submit:ios`
- `npm run web`
- `npm run lint`
- `npm run test`

## Native Module Note

This project uses the Expo development client for local device testing.

Once the development client is installed, the normal loop is:

- `npm run start`
- `npm run android`
- `npm run ios`

When the native app itself needs rebuilding, use:

- `npm run android:native`
- `npm run ios:native`

After the native app is installed once, most JS or UI work goes back to the `start` / `android` / `ios` scripts above.

## Native Android Setup

`npm run android:native` requires a working local Android/Java toolchain.

Checklist:

- Android Studio installed
- Android SDK installed
- a valid JDK available to Gradle through `JAVA_HOME` or `java` on `PATH`
- Android SDK discoverable through `ANDROID_HOME`, `android/local.properties`, or Android Studio
- Android SDK utilities available on `PATH` when needed, especially:
  - `platform-tools`
  - `emulator`
  - the JDK `bin` directory

Repository-local SDK path fix for Gradle, if auto-detection fails:

```properties
sdk.dir=<path-to-your-android-sdk>
```

Place that in:

- `android/local.properties`

Then run:

```powershell
npm run android:native
```

Notes:

- `npm run android` and `npm run ios` target the installed development client, not Expo Go.
- Most JS or UI changes still use Metro fast refresh after the native app has been built once.
- The exact JDK and Android SDK install paths are machine-specific and are intentionally not hard-coded in this guide.

## Store Deployment

This repo is set up for EAS Build with [eas.json](/c:/Users/phucn/DATA/Projects/repos/exposure-logger/eas.json).

Current app identifiers:

- Android package: `com.nguyenston.exposurelogger`
- iOS bundle identifier: `com.nguyenston.exposurelogger`

Typical flow:

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile production
eas build --platform ios --profile production
```

For store submission after the first successful build:

```bash
eas submit --platform android --profile production
eas submit --platform ios --profile production
```

Equivalent npm scripts:

```bash
npm run build:android
npm run build:ios
npm run submit:android
npm run submit:ios
```

Notes:

- Android production builds output an `.aab`.
- Preview builds use an Android `.apk` for easier device installs.
- The first Google Play submission is often easiest to do manually once before automating submit.

## GitHub Pages Policy Page

This repo publishes static docs pages through [`.github/workflows/deploy-docs.yml`](/c:/Users/phucn/DATA/Projects/repos/exposure-logger/.github/workflows/deploy-docs.yml).

It mirrors the same GitHub Actions Pages pattern as the referenced `mokuro-library` workflow, but without a VitePress build step because this repo only needs static pages for now.

Published files currently include:

- [pages/index.html](/c:/Users/phucn/DATA/Projects/repos/exposure-logger/pages/index.html)
- [pages/privacy-policy.html](/c:/Users/phucn/DATA/Projects/repos/exposure-logger/pages/privacy-policy.html)

Expected Pages URL pattern after enabling Pages in the repository settings:

```text
https://nguyenston.github.io/Exposure-Logger/
https://nguyenston.github.io/Exposure-Logger/privacy-policy.html
```

Repository settings needed once:

1. Open GitHub repository `Settings`.
2. Open `Pages`.
3. Set `Source` to `GitHub Actions`.
