# Repository Guide

## Overview

This document is a high-level map of the repository and the role of the main directories and files.

The project is now beyond the initial scaffold:

- Phases 0-1 established the app foundation and SQLite/Drizzle data layer
- Phases 2-5 added gear management, roll/exposure flows, GPS tagging, and CSV export
- Phase 6 added the first voice-input MVP for exposure entry

## Top-Level Structure

### `assets/`

Static Expo assets such as app icons, splash images, and platform-specific launch artwork.

### `docs/`

Project documentation.

Important files:

- `design.md`
  Product and architecture design
- `implementation-plan.md`
  Phased build plan and delivery sequencing
- `features/export_format.md`
  Current CSV and JSON backup export contracts
- `features/in-app-help.md`
  Screen-specific help-page design and header entry-point note
- `features/gear-registry.md`
  Gear metadata and autofill design note
- `features/search-filtering.md`
  Focused product/design note for rolls and exposure search
- `features/voice_parse_rules.md`
  Current voice transcript parser contract
- `competitive-notes.md`
  Lightweight competitor and market-positioning references
- `release-notes.md`
  Running draft for the next store release note, reset after each release
- `deployment-guide.md`
  Native setup, GitHub Pages, and release workflow
- `repo-guide.md`
  This file
- `logs/`
  Phase-by-phase implementation notes

### `pages/`

Static public GitHub Pages surface.

Important files:

- `index.html`
  Public landing page for repo docs/policy links
- `privacy-policy.html`
  Public privacy-policy page for store listing use

### `src/`

Main application source.

### `app.json`

Expo app configuration.

Contains:

- app metadata
- platform permissions
- Expo config plugins
- native-module plugin configuration such as speech recognition

### `package.json`

Project manifest and scripts.

Important scripts:

- `npm run start`
- `npm run android`
- `npm run android:native`
- `npm run ios`
- `npm run ios:native`
- `npm run web`
- `npm run lint`
- `npm run test`

Use `start`/`android`/`ios` for development-client based local development.

Use `android:native`/`ios:native` when the native app itself needs rebuilding.

Native Android builds also need local Java and Android SDK setup. In practice that means:

- `JAVA_HOME` should point at a JDK, commonly Android Studio `jbr`
- Gradle should be able to find the Android SDK through `ANDROID_HOME` or `android/local.properties`

### `tsconfig.json`

TypeScript configuration.

Notable behavior:

- strict mode enabled
- `@/*` alias maps to `src/*`

### `README.md`

GitHub-facing project overview.

### `docs/deployment-guide.md`

Detailed local native setup and EAS release guide.

## Source Structure

## `src/app/`

Expo Router route tree.

Notable routes:

- `src/app/_layout.tsx`
  Root stack, header actions, and app shell wrapper
- `src/app/index.tsx`
  Launch route that resumes the most relevant roll or routes into create/list flow
- `src/app/rolls/index.tsx`
  Rolls list grouped by status
- `src/app/rolls/new.tsx`
  Create roll screen
- `src/app/rolls/[rollId]/index.tsx`
  Roll detail screen
- `src/app/rolls/[rollId]/edit.tsx`
  Edit roll screen
- `src/app/exposures/new.tsx`
  New exposure flow with roll-scoped drafts and a split submit control where the right side selects the target frame and the main button commits the exposure
- `src/app/exposures/[exposureId]/edit.tsx`
  Edit exposure screen with persisted in-progress draft state
- `src/app/settings.tsx`
  App settings, including exposure defaults, frame-picker max, and whole-library export
- `src/app/gear/index.tsx`
  Dedicated gear management screen, including camera nicknames plus richer lens and film metadata editing

## `src/components/`

Reusable UI pieces not tied to one feature slice.

Notable files:

- `src/components/app-shell.tsx`
  Shared shell wrapper that also initializes the database
- `src/components/gear-selector.tsx`
  Search/select/create overlay for gear fields
- `src/components/horizontal-radio-picker.tsx`
  Wheel-style picker used for aperture, shutter speed, and target-frame selection
- `src/components/icons/`
  Shared SVG icon components such as film roll, settings, help, share, microphone, and close icons

### `src/components/__tests__/`

Component-level tests.

## `src/db/`

Database layer.

Key files:

- `src/db/client.ts`
  Raw Expo SQLite client plus Drizzle client
- `src/db/schema.ts`
  Drizzle schema definitions
- `src/db/bootstrap.ts`
  Migration/bootstrap logic using `PRAGMA user_version`
- `src/db/mappers.ts`
  Converts DB rows to app-facing domain models

### `src/db/repositories/`

Repository interfaces and SQLite-backed implementations.

Key contracts:

- `roll-repository.ts`
- `exposure-repository.ts`
- `gear-repository.ts`
- `app-settings-repository.ts`

Key implementations:

- `sqlite-roll-repository.ts`
- `sqlite-exposure-repository.ts`
- `sqlite-gear-repository.ts`
- `sqlite-app-settings-repository.ts`

Pattern:

- screens call feature hooks
- feature hooks call repositories
- repositories isolate SQLite/Drizzle details

### `src/db/__tests__/`

Tests for bootstrap, mapping, and repository behavior.

## `src/types/`

App-facing types.

Key files:

- `src/types/domain.ts`
  Roll, exposure, and gear entities
- `src/types/settings.ts`
  Persisted settings such as exposure defaults, stop increment, and export behavior

## `src/lib/`

Small shared utilities.

Key files:

- `src/lib/id.ts`
  ID generation
- `src/lib/time.ts`
  Timestamp helpers
- `src/lib/use-keyboard-offset.ts`
  Keyboard offset helper used in mobile forms

## `src/features/`

Feature-specific logic.

Key areas:

- `src/features/rolls/`
  Roll form, hooks, utilities, and tests, including box-ISO display derived from the selected film stock
- `src/features/exposures/`
  Exposure form, defaults, stop values, GPS refinement, voice parsing, date/time picker editing, and mid-roll insert behavior
- `src/features/gear/`
  Gear registry hooks, camera/lens/film metadata parsing, and helper logic
- `src/features/settings/`
  Settings hook for exposure defaults and export behavior

## `src/services/`

Device/integration services.

Current notable area:

- `src/services/export/`
  CSV formatting plus full-database backup/export and restore flow

## `src/store/`

Shared client state.

Current files:

- `src/store/current-location-store.ts`
  Shared last-known/current location state used by exposure flows
- `src/store/exposure-form-draft-store.ts`
  In-memory draft state for add/edit exposure forms across navigation
- `src/store/recent-gear-store.ts`
  Recent gear picks used by selectors

## How The App Currently Works

### Startup flow

1. Expo Router loads `src/app/_layout.tsx`
2. The layout renders `AppShell`
3. `AppShell` initializes the database
4. The launch route decides whether to resume a roll or route into creation/list flow

### Data flow

Current architecture:

1. screens call feature hooks
2. feature hooks call repositories or services
3. repositories use Drizzle + Expo SQLite
4. services handle device integrations such as export, location, and voice input

## Current Gaps

Remaining work is mostly polish and future features:

- voice input and native date/time editing require a rebuilt native app, not Expo Go
- import/restore from CSV is still future work
- advanced voice shortcuts and broader parsing remain future work
- target-frame selection for mid-roll insertion exists, but its UX is still evolving around chooser clarity and messaging
- remaining polish is focused on interaction feel and edge-case messaging

## Recommended Reading Order

If you want to understand the repo quickly, read in this order:

1. `docs/design.md`
2. `docs/implementation-plan.md`
3. `docs/features/export_format.md`
4. `docs/logs/phase-0.md` through `docs/logs/phase-6.md`
5. `src/app/_layout.tsx`
6. `src/app/index.tsx`
7. `src/features/exposures/exposure-form.tsx`
8. `src/db/bootstrap.ts`
9. `src/db/schema.ts`
10. `src/db/repositories/`

That sequence gives you product intent, the roadmap, the export contract, implementation history, and then the current runtime/data structure.
