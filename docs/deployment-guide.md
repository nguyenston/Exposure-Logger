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
