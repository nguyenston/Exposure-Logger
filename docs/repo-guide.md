# Repository Guide

## Overview

This document is a high-level guide to the repository structure and the purpose of the main files.

The project is currently in early implementation:

- Phase 0 established the app foundation
- Phase 1 added database bootstrap and repository implementations
- UI flows are still mostly placeholders

## Top-Level Structure

### `assets/`

Static Expo app assets such as icons and splash images.

### `docs/`

Project documentation.

Current files:

- `design.md`
  Product and architecture design document
- `implementation-plan.md`
  Forward-looking phased implementation plan
- `repo-guide.md`
  This file
- `logs/`
  Retrospective implementation logs by phase

### `src/`

Application source code.

This is the main working directory for product code.

### `app.json`

Expo app configuration.

Contains:

- app name and slug
- app scheme
- platform config
- Expo Router plugin registration

### `package.json`

Project manifest and scripts.

Important scripts:

- `npm run start`
- `npm run android`
- `npm run ios`
- `npm run web`
- `npm run lint`
- `npm run test`

### `tsconfig.json`

TypeScript configuration.

Notable behavior:

- strict mode enabled
- `@/*` path alias maps to `src/*`

### `babel.config.js`

Babel config for Expo and React Native Reanimated.

### `eslint.config.js`

Flat ESLint configuration using Expo’s ESLint preset.

### `jest.config.js`

Jest configuration for the Expo app.

### `README.md`

Short project-level setup and conventions guide.

## Source Structure

## `src/app/`

Expo Router route tree.

These files define screens and navigation paths.

Current files:

- `src/app/_layout.tsx`
  Root router layout and navigation shell
- `src/app/index.tsx`
  Placeholder rolls list screen
- `src/app/rolls/[rollId].tsx`
  Placeholder roll detail screen
- `src/app/exposures/new.tsx`
  Placeholder quick add exposure screen
- `src/app/settings.tsx`
  Placeholder settings screen

## `src/components/`

Reusable UI components that are not tied to a single feature.

Current files:

- `src/components/app-shell.tsx`
  Shared shell wrapper used by the root layout; currently also runs DB initialization on startup
- `src/components/placeholder-card.tsx`
  Simple placeholder UI card used by the current screens

### `src/components/__tests__/`

Component-level tests.

Current test:

- `app-shell.test.tsx`

## `src/db/`

Database layer.

This is the most important implementation area after `src/app`.

Current files:

- `src/db/client.ts`
  Exposes the raw Expo SQLite client and the Drizzle client
- `src/db/schema.ts`
  Drizzle schema definitions for `rolls`, `exposures`, and `gear_registry`
- `src/db/bootstrap.ts`
  Database initialization and schema bootstrap using `PRAGMA user_version`
- `src/db/mappers.ts`
  Converts DB row shapes into app-facing domain models and normalized insert payloads

### `src/db/repositories/`

Repository contracts and SQLite-backed implementations.

Contract files:

- `roll-repository.ts`
- `exposure-repository.ts`
- `gear-repository.ts`

Implementation files:

- `sqlite-roll-repository.ts`
- `sqlite-exposure-repository.ts`
- `sqlite-gear-repository.ts`

Pattern:

- contracts define the app-facing repository interfaces
- SQLite implementations use Drizzle internally
- screens should depend on repositories, not direct SQLite access

### `src/db/__tests__/`

Database-layer tests.

Current tests:

- `bootstrap.test.ts`
  Tests schema bootstrap behavior through mocks
- `mappers.test.ts`
  Tests domain mapping behavior
- `sqlite-repositories.test.ts`
  Tests repository logic with injected mock DB clients

## `src/types/`

App-facing types and domain models.

Current file:

- `src/types/domain.ts`
  Defines `Roll`, `Exposure`, `GearRegistryItem`, `RollStatus`, and `GearType`

## `src/lib/`

Small shared utilities that do not belong to a specific feature.

Current files:

- `src/lib/id.ts`
  ID generation helper
- `src/lib/time.ts`
  ISO timestamp helper

## `src/features/`

Reserved for feature-specific modules once the app moves past placeholder screens.

Currently only contains a placeholder README.

Expected future content:

- roll feature logic
- exposure feature logic
- gear selector flows

## `src/services/`

Reserved for device or integration services.

Expected future content:

- location service
- CSV export service
- possible voice transcription integration

## `src/store/`

Reserved for shared client state.

Expected future content:

- active roll context
- recent selections
- UI preferences

## How The App Currently Works

### Startup flow

1. Expo Router loads `src/app/_layout.tsx`
2. The layout renders `AppShell`
3. `AppShell` calls `initializeDatabase()`
4. The database bootstrap creates tables if needed
5. Placeholder routes render on top of the initialized app shell

### Data flow

Current intended architecture:

1. screens call repositories
2. repositories use Drizzle and SQLite
3. mappers convert DB rows into domain types
4. domain types are what the app should pass around

At the moment, the screens are placeholders and do not yet call the repositories.

## Current Gaps

These areas exist structurally but are not wired into the UI yet:

- roll CRUD screens
- exposure logging form
- gear registry management UI
- searchable selectors
- CSV export
- location capture

## Recommended Navigation For Contributors

If you are trying to understand the repo quickly, read in this order:

1. `docs/design.md`
2. `docs/implementation-plan.md`
3. `docs/logs/phase-0.md`
4. `docs/logs/phase-1.md`
5. `src/app/_layout.tsx`
6. `src/db/bootstrap.ts`
7. `src/db/schema.ts`
8. `src/db/repositories/`

That sequence gives the product intent, the phased roadmap, the implementation history, and the current technical foundation.
