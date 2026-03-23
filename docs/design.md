# Exposure Logger Mobile App Design

## 1. Overview

### Problem
Film photographers need a fast way to log exposure settings and context while shooting. Notes are often scattered across paper, phone notes, or memory, which makes it hard to review a roll later and learn from results.

### Goal
Build a mobile app that organizes exposure logs by roll and lets a user quickly capture:

- Exposure metadata: `f-stop`, `shutter speed`, `GPS location`, `time`, `lens`, `notes`
- Roll metadata: `camera`, `film stock`, `native ISO`, `shot ISO`, `notes`

The app should ship on Android first, with a path to iOS without rewriting the product.

### Product principles

- Local-first: logging must work without network access
- Fast entry: logging an exposure should take a few taps
- Roll-centric: every exposure belongs to a roll
- Structured but flexible: common fields are normalized, notes stay freeform
- Portable: Android first, iOS-ready architecture

## 2. Recommended Tech Stack

## Recommendation

Use **React Native with Expo and TypeScript** for the client, with **SQLite** for local persistence.

### Why this stack

- **Android first, iOS later**: one codebase supports both platforms
- **Fast MVP delivery**: Expo reduces native setup overhead
- **Strong device APIs**: location, storage, notifications, camera access if added later
- **Type safety**: TypeScript is useful for form-heavy apps and data models
- **Local-first fit**: SQLite is a strong match for structured offline data

### Core stack

- **Framework**: React Native + Expo
- **Language**: TypeScript
- **Navigation**: Expo Router or React Navigation
- **State management**: Zustand
- **Local database**: `expo-sqlite`
- **Schema / query layer**: Drizzle ORM for SQLite, or direct repository wrappers if keeping MVP lean
- **Forms**: React Hook Form + Zod
- **Location**: `expo-location`
- **Validation**: Zod
- **UI**: React Native primitives with a lightweight component library such as Tamagui or NativeWind only if the team wants faster styling
- **Testing**: Jest + React Native Testing Library, plus a few end-to-end tests with Detox
- **Build / release**: Expo Application Services (EAS)

### Backend

For MVP, **no backend is required**.

The app should be fully useful with local-only storage. This keeps scope under control and matches the intended usage.

### Optional later integrations

Future integration should be treated as export destinations or optional enhancement services rather than core infrastructure. Examples:

- Google Drive export target
- iCloud Drive or Files export target
- Dropbox export target
- share-sheet based export flow
- voice transcription and parsing services

These are outside MVP and should not shape the first-version architecture beyond keeping CSV export well-structured.

## 3. Alternatives Considered

### Flutter

Good option if:

- the team prefers Dart
- highly customized UI is a priority
- strong cross-platform consistency matters more than JavaScript ecosystem fit

Why not first choice:

- Expo + React Native is often faster for JS/TS teams
- the web and JS ecosystem around forms, validation, and product iteration is very strong

### Native Android first

Good option if:

- Android is the only real target
- deep Android-specific integrations matter immediately

Why not first choice:

- iOS portability later becomes a rewrite or near-rewrite
- not necessary for this app’s feature set

## 4. Scope

### MVP

- Create and manage rolls
- Add exposures to a roll
- Capture or edit exposure metadata
- Auto-fill time on creation
- Optionally attach GPS location to an exposure
- Register and manage reusable cameras, lenses, and film stocks
- Use searchable dropdown selectors for camera, lens, and film stock fields
- Allow quick-register from selectors when an item does not exist yet
- Browse exposures in roll order
- Edit and delete rolls and exposures
- Search or filter rolls by camera or film stock
- Export data as CSV

### Post-MVP

- Frame numbering assistance
- Photo attachment per exposure
- Development notes after scan/develop
- Development calculator tools
- Push notifications for unfinished rolls
- Optional export integrations such as Google Drive or Dropbox
- Voice transcription and parsing for hands-free logging

## 5. Functional Requirements

### Roll management

Users can:

- create a roll
- set camera, film stock, native ISO, shot ISO, and notes
- mark a roll as active, finished, or archived
- view all exposures associated with the roll

### Exposure logging

Users can:

- add an exposure to a selected roll
- record `f-stop`
- record `shutter speed`
- record `lens`
- record `timestamp`
- record `GPS location`
- add notes

### Metadata behavior

- `timestamp` defaults to current device time
- `GPS location` is optional and permission-based
- `push/pull` should be derived from the roll's native ISO and shot ISO when they differ
- when adding a new exposure to a roll, the form should default to the previous exposure's values where applicable
- defaulting behavior for `f-stop`, `shutter speed`, `lens`, `timestamp`, `location enabled`, and `default to current GPS` should be configurable from Settings
- `f-stop` and `shutter speed` should use a wheel-style step selector rather than free text for normal logging
- the stop selector should respect the configured increment (`1`, `1/2`, or `1/3` stop)
- GPS should prefer last known location first, then refine with a fresher fix
- exposure save should not block on GPS refinement; the saved exposure may be patched later if a better fix arrives
- camera, film stock, and lens should be selectable from searchable dropdowns
- each selector should allow quick registration of a new entry when no match exists
- recent selections should still be surfaced to reduce typing

### Data portability

Users can:

- export an individual roll as CSV
- export the whole library as CSV
- restore from a previous export in a future version

Export rules:

- per-roll export can be used on any roll
- whole-library export should include finished rolls by default
- successful whole-library export can auto-archive exported finished rolls
- whole-library export scope and auto-archive behavior should be adjustable in Settings

## 6. Non-Functional Requirements

- Works offline
- Exposure logging interaction should feel fast enough for in-field use
- Data remains available across app restarts
- User data is stored locally and can be exported
- App should degrade gracefully if location permission is denied

## 7. User Experience

### Main screens

1. **Rolls List**
   Shows active and archived rolls.

2. **Create / Edit Roll**
   Fields: camera, film stock, native ISO, shot ISO, notes, optional start date. Camera and film stock use searchable selectors with quick-add.

3. **Roll Detail**
   Shows roll metadata and exposure list.

4. **Quick Add Exposure**
   Fast entry form optimized for repeated logging. Lens uses a searchable selector with quick-add.

5. **Exposure Detail / Edit**
   Full metadata editor.

6. **Settings / Export**
   Export data, manage exposure defaults, privacy options, and library export behavior.

### UX notes

- The primary action should be `Add Exposure` from the active roll screen
- Default new exposure fields to the previous exposure's selections when available
- Let users configure whether previous values, current timestamp, the location section, and current GPS fetch are enabled by default
- Minimize typing by using wheel-style selectors for common shutter and aperture values
- Gear selectors should use filterable dropdowns rather than long static pickers
- If a camera, lens, or film stock is missing, the selector should offer `Create "<query>"`
- Gear selectors should not expose inline destructive actions such as per-row delete buttons
- Gear deletion and rename flows should live on a separate gear management screen so the picker stays fast and low-risk
- Support manual entry when needed for unusual values

## 8. Domain Model

### Entities

#### Roll

- `id`
- `camera`
- `filmStock`
- `nativeIso`
- `shotIso`
- `notes`
- `status` (`active`, `finished`, `archived`)
- `startedAt`
- `finishedAt`
- `createdAt`
- `updatedAt`

#### Exposure

- `id`
- `rollId`
- `sequenceNumber`
- `fStop`
- `shutterSpeed`
- `lens`
- `latitude`
- `longitude`
- `locationAccuracy`
- `capturedAt`
- `notes`
- `createdAt`
- `updatedAt`

#### Gear registry

- `id`
- `type` (`camera`, `lens`, `film`)
- `name`
- `notes`
- `createdAt`
- `updatedAt`

### Notes on modeling

- `push/pull` is usually a roll-level development choice, so native ISO and shot ISO should live on the roll and push/pull should be derived from them
- `sequenceNumber` should be explicit rather than inferred, so users can correct numbering manually
- gear registry records support fast selection and keep naming consistent across logs

## 9. Data Storage Design

### Local database

SQLite tables:

- `rolls`
- `exposures`
- `gear_registry`

### Example schema

```sql
CREATE TABLE rolls (
  id TEXT PRIMARY KEY,
  camera TEXT NOT NULL,
  film_stock TEXT NOT NULL,
  native_iso INTEGER,
  shot_iso INTEGER,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TEXT,
  finished_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE exposures (
  id TEXT PRIMARY KEY,
  roll_id TEXT NOT NULL REFERENCES rolls(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  f_stop TEXT NOT NULL,
  shutter_speed TEXT NOT NULL,
  lens TEXT,
  latitude REAL,
  longitude REAL,
  location_accuracy REAL,
  captured_at TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE gear_registry (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Storage rationale

- SQLite is robust, simple, and fast for this structured dataset
- Text fields for `f-stop` and `shutter speed` avoid awkward normalization too early
- integer fields for ISO keep roll speed data structured and derivable
- ISO timestamps are easy to serialize and export
- a dedicated gear registry enables filterable dropdown selection and quick-add flows

## 10. Architecture

### App architecture

Use a simple layered architecture:

1. **UI layer**
   Screens, forms, navigation, presentation logic

2. **State layer**
   Active roll, transient form state, filters, recent selections

3. **Domain layer**
   Use cases such as `createRoll`, `addExposure`, `finishRoll`, `exportCsv`, `registerGear`

4. **Data layer**
   SQLite repositories, device services for location, CSV generation, and file export

### Suggested folder structure

```text
src/
  app/
  components/
  features/
    rolls/
    exposures/
    settings/
  db/
    schema/
    repositories/
  services/
    location/
    export/
    transcription/
  store/
  lib/
  types/
```

### Why this architecture

- keeps device integrations separate from business logic
- avoids coupling screens directly to database queries
- keeps future export or transcription integrations isolated from the core logging flow

## 11. Key Flows

### Create a roll

1. User opens `New Roll`
2. Enters camera, film stock, native ISO, shot ISO, and notes
3. App creates roll with `active` status
4. Roll status changes later from the edit flow when needed
4. User lands on roll detail screen

### Add exposure

1. User taps `Add Exposure` on an active roll
2. App pre-fills current time
3. App pre-selects the previous exposure's values when available
4. App applies settings-driven defaults for timestamp, stop increment, location section state, and current GPS fetch
5. App uses last known location immediately when available and refines with a fresher GPS fix afterward
6. User adjusts aperture, shutter speed, lens, and notes as needed
7. App stores exposure with incremented `sequenceNumber` without blocking on GPS refinement
8. If a better location fix arrives, only that saved exposure is updated

### Quick-register gear from selector

1. User opens a camera, lens, or film stock selector
2. User types filter text
3. If no exact match exists, selector offers `Create "<query>"`
4. User confirms quick registration
5. New gear item is saved and selected immediately

### Manage gear separately

1. User opens the dedicated gear management screen
2. User browses existing cameras, lenses, or film stocks
3. User renames or deletes entries there
4. Selector overlays remain focused on search, selection, and quick-add only

### Finish roll

1. User marks roll as finished
2. App records `finishedAt`
3. Roll remains viewable and editable

### Export logs

1. User opens either roll detail for per-roll export or settings for whole-library export
2. User selects CSV export
3. App generates file from local database
4. User shares or saves the export
5. If whole-library export succeeds, app optionally auto-archives exported finished rolls based on Settings

## 12. Permissions and Privacy

### Required permissions

- Location permission: optional, used only when user wants GPS tagging

### Privacy approach

- No account required for MVP
- No data leaves device by default
- Location is opt-in and can be omitted per exposure
- GPS refinement only updates the saved exposure that requested it; it does not blanket-update other exposures
- Export is user-initiated
- auto-archive after export should only happen after a confirmed successful export action

## 13. Testing Strategy

### Unit tests

- data validators
- sequence number generation
- domain use cases
- CSV export formatting
- quick-register gear behavior

### Integration tests

- create roll and add exposures
- edit and delete exposure
- finish roll
- export CSV
- selector quick-add flow for camera, lens, and film stock

### End-to-end tests

- first-run flow
- location permission denied flow
- quick logging flow on an active roll
- create missing gear from selector flow

## 14. Delivery Plan

### Phase 1: MVP Android

- project setup
- SQLite schema and repositories
- gear registry CRUD and searchable selectors
- roll CRUD
- exposure CRUD
- location capture
- CSV export
- Android release build

### Phase 2: Polish

- recent values and selector tuning
- better filters and search
- UI optimization for fast repeated entry
- testing hardening

### Phase 3: iOS

- validate UI and permission flows on iOS
- adjust platform-specific behaviors
- ship from same codebase

### Phase 4: Stretch features

- export integrations such as Google Drive
- voice transcription and parsing
- photo attachment or advanced metadata tools

## 15. Risks and Decisions

### Main risks

- Slow logging UX if forms require too much typing
- Inconsistent exposure value entry if fields are too freeform
- Searchable selectors becoming clumsy if quick-add is not integrated well
- Picker overlays becoming noisy or error-prone if destructive management actions are mixed into the main selection list

### Mitigations

- stay offline-only for MVP
- bias toward quick-pick controls with manual override
- use recent-value shortcuts and a gear registry with in-flow quick-add
- keep destructive gear management on a separate screen rather than inside picker rows

## 16. Recommended Decisions

- Build the app in **React Native + Expo + TypeScript**
- Use **SQLite** as the source of truth for MVP
- Keep the app **offline-only** and **backend-free** for MVP
- Model data around **rolls** and **exposures**
- Add a **gear registry** for cameras, lenses, and film stocks
- Use **filterable dropdown selectors with quick-add**
- Keep **gear management separate from selection**: selector overlays handle search/select/create, while rename/delete happens on the gear registry screen
- Make **location optional**
- Store **native ISO** and **shot ISO** on the roll and derive **push/pull** from their difference
- Make **CSV export** the primary portability path
- Support both **per-roll** and **whole-library** CSV export
- Default whole-library export to **finished rolls only**
- Make **auto-archive after successful whole-library export** a user setting
- Treat **voice transcription** as a stretch goal

## 17. Next Steps

1. Confirm the stack choice: React Native or Flutter
2. Define selector behavior for gear registration and search
3. Create the Expo project skeleton
4. Implement the SQLite schema and repository layer
5. Build roll and exposure entry flows
