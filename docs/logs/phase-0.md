# Phase 0 Implementation Log

## Overview

This document records what actually happened during Phase 0 implementation.

It is not a forward-looking plan. It is a factual log of the repo state, implementation decisions made during setup, issues encountered, and the resulting baseline.

## Phase 0: Project Setup

### Status

Completed.

### Goal

Establish a strong mobile app foundation for the offline exposure logger:

- Expo + React Native + TypeScript
- Expo Router
- SQLite with Drizzle ORM
- Jest and React Native Testing Library
- placeholder screens instead of real product flows

## What Was Implemented

### 1. Expo app scaffold

The repository started as docs-only. An Expo TypeScript app was initialized in place using the blank TypeScript template.

Result:

- root Expo app created
- `node_modules` installed
- base Expo config added

### 2. Router migration

The generated blank app was converted from the default `App.tsx` entrypoint to `Expo Router`.

Changes made:

- removed `App.tsx`
- removed `index.ts`
- changed `package.json` `main` to `expo-router/entry`
- added Expo Router plugin and app scheme in `app.json`
- created route structure under `src/app`

Implemented placeholder routes:

- `src/app/index.tsx`
- `src/app/rolls/[rollId].tsx`
- `src/app/exposures/new.tsx`
- `src/app/settings.tsx`
- `src/app/_layout.tsx`

### 3. Base project structure

The repo now contains the Phase 0 folder layout:

- `src/app`
- `src/components`
- `src/features`
- `src/db`
- `src/services`
- `src/store`
- `src/types`
- `src/lib`

For folders not yet in active use, README placeholder files were added so the structure is explicit.

### 4. UI shell

A minimal app shell was added:

- `src/components/app-shell.tsx`
- `src/components/placeholder-card.tsx`

The router layout currently wraps the app in:

- `GestureHandlerRootView`
- `SafeAreaProvider`
- a shared `AppShell`

This gives a stable shell for later phases without implementing real roll or exposure behavior yet.

### 5. SQLite + Drizzle foundation

The app now includes a typed local database foundation using:

- `expo-sqlite`
- `drizzle-orm`

Implemented files:

- `src/db/client.ts`
- `src/db/schema.ts`
- `src/db/mappers.ts`

Schema tables defined:

- `rolls`
- `exposures`
- `gear_registry`

Notes:

- schema exists, but migrations were not implemented in Phase 0
- the DB client is created synchronously via `openDatabaseSync`
- row-to-domain mappers were added so app-facing models do not depend directly on Drizzle table row shapes

### 6. Repository contracts

Repository interfaces were defined, but not implemented with real CRUD yet.

Implemented files:

- `src/db/repositories/roll-repository.ts`
- `src/db/repositories/exposure-repository.ts`
- `src/db/repositories/gear-repository.ts`

This matches the Phase 0 intent: lock the boundaries before implementing persistence behavior in Phase 1.

### 7. Domain model

Explicit app-facing types were added in:

- `src/types/domain.ts`

Types added:

- `Roll`
- `Exposure`
- `GearRegistryItem`
- `RollStatus`
- `GearType`

Decision taken during implementation:

- domain types remain separate from Drizzle schema definitions
- repository and mapper layers are responsible for converting DB rows into app-facing types

### 8. Tooling

Linting, formatting, Babel, and test config were added:

- `eslint.config.js`
- `.prettierrc.json`
- `babel.config.js`
- `jest.config.js`
- `jest.setup.ts`

`package.json` scripts now include:

- `lint`
- `format`
- `test`

### 9. Tests

Two baseline tests were added:

- `src/components/__tests__/app-shell.test.tsx`
- `src/db/__tests__/mappers.test.ts`

These cover:

- root shell rendering
- mapper behavior for domain conversion

### 10. Documentation

A repo-level `README.md` was added to document:

- stack
- commands
- conventions
- current Phase 0 scope

## Dependencies Added

### Runtime

- `expo-router`
- `expo-sqlite`
- `drizzle-orm`
- `zustand`
- `react-native-safe-area-context`
- `react-native-screens`
- `react-native-gesture-handler`
- `react-native-reanimated`
- `react-dom`
- `react-test-renderer`

### Dev

- `jest`
- `jest-expo`
- `@testing-library/react-native`
- `@testing-library/jest-native`
- `eslint`
- `eslint-config-expo`
- `prettier`
- `babel-preset-expo`
- `@types/jest`

## Issues Encountered During Implementation

### 1. PowerShell command chaining

An `npm install` command was initially written using `&&`, which failed in the current PowerShell environment.

Resolution:

- reran dependency installation as separate commands

### 2. React peer dependency mismatch

Installing the test toolchain failed because Expo Router and related web-side peers wanted a React patch version that did not match the scaffold’s initial `19.2.0`.

Resolution:

- aligned `react`, `react-dom`, and `react-test-renderer` to `19.2.4`

### 3. Missing `babel-preset-expo`

Jest initially failed because `babel-preset-expo` was not present.

Resolution:

- added `babel-preset-expo` as a dev dependency

### 4. Deprecated matcher package

`@testing-library/jest-native` works, but is deprecated upstream.

Current status:

- still installed because it made the initial matcher setup straightforward
- can be removed in a cleanup pass later in favor of built-in matchers from `@testing-library/react-native`

## Verification Performed

The following checks were run successfully after implementation:

- `npm run lint`
- `npm test -- --runInBand`
- `npx tsc --noEmit`

## What Was Not Implemented Yet

Phase 0 intentionally stopped short of product behavior.

Not implemented:

- real roll CRUD
- real exposure CRUD
- gear registry CRUD
- migrations or schema bootstrap routines
- form flows
- CSV export
- location capture
- selector UI
- state management beyond structural setup

## Deviations From The Original Phase 0 Plan

### Implemented as planned

- Expo app scaffold
- Expo Router
- Drizzle + SQLite foundation
- explicit domain types
- repository contracts
- Jest + React Native Testing Library
- README and project conventions

### Minor deviations

- `zustand` was installed as part of the baseline dependency set, but is not used yet
- migrations were deferred even though the DB foundation is present
- `@testing-library/jest-native` was added despite being deprecated, because it simplified the initial test setup
- placeholder README files were added in unused folders to make structure explicit

## Current Repository Baseline

At the end of Phase 0, the project is a runnable Expo app with:

- file-based navigation
- placeholder screens for the main app sections
- a typed local database foundation
- repository boundaries
- linting, formatting, tests, and type-checking

This is a valid starting point for Phase 1, which should implement real database bootstrap and CRUD behavior behind the repository interfaces.
