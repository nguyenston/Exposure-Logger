# Phase 1 Implementation Log

## Overview

This document records what actually happened during Phase 1 implementation.

Phase 1 focused on turning the Phase 0 database foundation into a usable local data layer with schema bootstrap, repository implementations, and test coverage around the repository behavior.

## Status

Completed.

## Goals

- establish local persistence structure
- add schema bootstrap logic
- implement repository CRUD behavior
- keep screens isolated from direct SQLite access
- add tests around the data layer

## What Was Implemented

### 1. Database bootstrap

Added:

- `src/db/bootstrap.ts`

Implementation details:

- uses `PRAGMA user_version` for simple schema versioning
- runs a Phase 1 bootstrap SQL script when `user_version < 1`
- creates `rolls`, `exposures`, and `gear_registry`
- adds indexes for roll exposure lookup and gear lookup
- enables foreign keys with `PRAGMA foreign_keys = ON`

Current approach:

- synchronous bootstrap via Expo SQLite
- one migration version only
- no separate migration runner yet

### 2. App startup initialization

Updated:

- `src/components/app-shell.tsx`

Behavior:

- the app now calls `initializeDatabase()` on startup
- this ensures the schema is created before later feature work begins using the repositories

### 3. Shared DB helpers

Added:

- `src/lib/id.ts`
- `src/lib/time.ts`

Purpose:

- consistent ID generation for repository-created records
- consistent ISO timestamp generation for create and update flows

### 4. Row mapping and insert shaping

Updated:

- `src/db/mappers.ts`

Changes:

- existing row-to-domain mappers kept
- added helper functions for normalized insert payloads:
  - `toRollInsert`
  - `toExposureInsert`
  - `toGearRegistryInsert`

This keeps repository code cleaner and preserves the boundary between DB shapes and app-facing types.

### 5. Repository contract updates

Updated:

- `src/db/repositories/roll-repository.ts`
- `src/db/repositories/exposure-repository.ts`

Changes:

- `CreateRollInput` now allows `status` to be omitted and default to `active`
- `CreateExposureInput` now allows `sequenceNumber` to be omitted so repositories can auto-increment per roll

### 6. SQLite repository implementations

Added:

- `src/db/repositories/sqlite-roll-repository.ts`
- `src/db/repositories/sqlite-exposure-repository.ts`
- `src/db/repositories/sqlite-gear-repository.ts`

Implemented behavior:

- list, get, create, update, delete for rolls
- list by roll, get, create, update, delete for exposures
- list by type, get, create, update, delete for gear
- timestamps default automatically on create/update
- IDs default automatically on create
- exposure sequence numbers auto-increment per roll when not provided

Design choice:

- repository classes accept an injectable DB dependency, but default to the shared Drizzle client
- this kept runtime usage simple while making tests possible without a real native SQLite instance

### 7. DB client adjustment

Updated:

- `src/db/client.ts`

Change:

- exported both `sqlite` and `db`

This was needed so bootstrap logic could work directly with the underlying SQLite client while repositories continued to use Drizzle.

## Testing

### Added tests

- `src/db/__tests__/bootstrap.test.ts`
- `src/db/__tests__/sqlite-repositories.test.ts`

Existing tests retained:

- `src/db/__tests__/mappers.test.ts`
- `src/components/__tests__/app-shell.test.tsx`

Covered behaviors:

- bootstrap executes schema setup and updates `user_version`
- repositories create and update rolls
- repositories create and list gear items
- exposure sequence numbers auto-increment per roll
- app shell still renders correctly

## Issues Encountered

### 1. Jest cannot open Expo native SQLite directly

The initial test approach attempted to use the real Expo SQLite client under Jest.

Problem:

- Jest does not provide the native SQLite constructor that Expo uses at runtime
- importing the real DB client caused native module errors in tests

Resolution:

- switched repository tests to use dependency injection and mocked DB clients
- mocked bootstrap behavior through the exported SQLite client
- mocked bootstrap initialization in the app shell test

### 2. Expo SQLite dependency chain in Jest

During the first test attempt, `expo-sqlite` also pulled in `expo-asset`.

Resolution:

- added `expo-asset` to the project so the Expo dependency chain resolves correctly

### 3. Mocked query behavior had to match app-side naming

The repository test double initially failed because Drizzle columns use SQL names like `roll_id`, while app-side test rows were stored in camelCase.

Resolution:

- normalized mocked column access from snake_case to camelCase in the repository tests

## Verification Performed

The following checks passed after implementation:

- `npm run lint`
- `npm test -- --runInBand`
- `npx tsc --noEmit`

## What Was Not Implemented Yet

Phase 1 completed the local data layer foundation, but stopped short of UI integration.

Still not implemented:

- repository usage from real screens
- migration files or multi-version migration strategy
- seed data or fixtures
- roll/exposure forms
- gear selector UI
- CSV export
- location capture

## Resulting Baseline

At the end of Phase 1, the app now has:

- database bootstrap on startup
- typed schema definitions
- real Drizzle-backed repository implementations
- auto timestamping and ID generation
- per-roll exposure sequence auto-increment
- test coverage around bootstrap and repository behavior

This is a valid handoff point for Phase 2, which should build the gear registry UI and selector flows on top of the working repository layer.
