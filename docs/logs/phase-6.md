# Phase 6: Voice Input MVP

## Goal

Add a hands-free exposure entry helper without turning the core form into a black-box AI workflow.

## What Landed

- Added `expo-speech-recognition` and configured the Expo plugin in [app.json](c:/Users/phucn/DATA/Projects/repos/exposure-logger/app.json).
- Added a safe speech-recognition wrapper in [src/features/exposures/use-exposure-voice-input.ts](c:/Users/phucn/DATA/Projects/repos/exposure-logger/src/features/exposures/use-exposure-voice-input.ts).
- Added transcript parsing in [src/features/exposures/voice-transcript.ts](c:/Users/phucn/DATA/Projects/repos/exposure-logger/src/features/exposures/voice-transcript.ts).
- Added parser tests in [src/features/exposures/__tests__/voice-transcript.test.ts](c:/Users/phucn/DATA/Projects/repos/exposure-logger/src/features/exposures/__tests__/voice-transcript.test.ts).
- Added the voice entry panel to [src/features/exposures/exposure-form.tsx](c:/Users/phucn/DATA/Projects/repos/exposure-logger/src/features/exposures/exposure-form.tsx).
- Added explicit native build scripts in [package.json](c:/Users/phucn/DATA/Projects/repos/exposure-logger/package.json) and documented the Android native workflow in [README.md](c:/Users/phucn/DATA/Projects/repos/exposure-logger/README.md) and [docs/repo-guide.md](c:/Users/phucn/DATA/Projects/repos/exposure-logger/docs/repo-guide.md).
- Added a shared focus-aware keyboard visibility helper in [src/lib/use-focused-field-visibility.ts](c:/Users/phucn/DATA/Projects/repos/exposure-logger/src/lib/use-focused-field-visibility.ts) and applied it to roll, exposure, and gear registry text fields.
- Updated [src/components/app-shell.tsx](c:/Users/phucn/DATA/Projects/repos/exposure-logger/src/components/app-shell.tsx) so the app waits for database bootstrap before rendering screens, avoiding fresh-install table races.

## Product Decisions

- Voice input is optional and lives inside the exposure form.
- Voice transcript apply mode is a user setting and defaults to auto-apply.
- Auto-apply can apply any recognized subset of fields, including fine-grained voice edits.
- Notes append by default, but `note overwrite` / `note replace` switch voice notes into replace mode.
- The first parser expects command words such as `f stop`, `at`, `lens`, and `notes`.
- This is a native-build feature. Installing the package is not enough; the development app must be rebuilt to include the native module.
- Expo Go remains useful for most JS work, but speech recognition requires the rebuilt native app.
- Focused text inputs should scroll only enough to stay visible above the keyboard instead of relying on fixed padding.
- Roll detail now keeps the exposure card near the top, collapsed by default, with explicit browsing controls and a jump-to-latest action.

## Expected Phrase Shape

Examples the MVP parser is designed around:

- `f stop 2.8 at 60 lens 50mm`
- `aperture two point eight shutter two seconds`
- `f stop 8 at 125 lens 40mm notes storefront at dusk`

## Known Limits

- Parsing is intentionally conservative and may ignore unlabeled freeform speech.
- Lens and notes are parsed reliably only when the transcript includes `lens` and `note(s)`.
- The first version prefers explicit commands over fuzzy inference.
- Voice entry can surface as unavailable on old Expo Go / old development clients until the app is rebuilt.
- Native Android setup still depends on local Java and Android SDK configuration, including `JAVA_HOME` and SDK discovery for Gradle.
