# Phase 2 Implementation Log

## Overview

This document records what actually happened during Phase 2 implementation.

Phase 2 focused on the gear registry workflow: reusable searchable selectors, quick-create behavior, recent selection tracking, and a basic management screen for cameras, lenses, and film stocks.

## Status

Completed.

## Goals

- make repeated entry faster with reusable gear selectors
- wire the UI to the existing gear repository
- support quick registration when a gear item does not exist
- add recent selection behavior
- provide a simple management screen for the gear registry

## What Was Implemented

### 1. Gear utility functions

Added:

- `src/features/gear/gear-utils.ts`

Behavior added:

- normalize search text
- detect exact match for quick-create suppression
- sort visible options with recent items prioritized before alphabetical ordering

### 2. Recent selection store

Added:

- `src/store/recent-gear-store.ts`

Implementation details:

- uses Zustand
- stores up to five recent item IDs per gear type
- supports `camera`, `lens`, and `film`

This is the first real use of `src/store/` in the app.

### 3. Gear registry hook

Added:

- `src/features/gear/use-gear-registry.ts`

Behavior added:

- loads gear items by type
- exposes visible filtered items for selectors
- creates gear items with duplicate-name detection
- updates and deletes gear items
- tracks recent selections
- lazily imports the repository module instead of eagerly importing SQLite-backed code

Design choice:

- the hook returns empty/no-op behavior on web rather than trying to initialize Expo SQLite there
- this keeps the app bundle stable on web while Phase 2 remains mobile-first

### 4. Reusable gear selector component

Added:

- `src/components/gear-selector.tsx`

Behavior added:

- pressable selector field
- modal-based picker UI
- search text input
- filtered option list
- quick-create action when there is no exact match
- recent selection support through the hook/store

This is the reusable component Phase 3 and Phase 4 will build on.

### 5. Gear registry screen

Added:

- `src/app/gear/index.tsx`

Behavior added:

- type tabs for cameras, lenses, and film
- create new item flow
- list existing items
- rename existing items
- delete existing items

This is a pragmatic management screen rather than a final polished workflow, but it gives the repository layer a real UI entry point.

### 6. Route updates

Updated:

- `src/app/_layout.tsx`
- `src/app/settings.tsx`

Changes:

- added a stack screen for the gear registry route
- settings now links to `/gear`

### 7. First selector integration into a screen

Updated:

- `src/app/exposures/new.tsx`

Change:

- replaced the pure placeholder-only screen with a real `GearSelector` for lens selection

This is still not a full exposure form, but it proves the selector pattern inside an actual route.

### 8. Theme updates

Updated:

- `src/theme/colors.ts`

Changes:

- added overlay color
- added destructive color

This kept the new selector and management screen aligned with the repo rule of centralizing color values.

## Testing

### Added tests

- `src/features/gear/__tests__/gear-utils.test.ts`

Covered behaviors:

- exact match detection
- recent-first sorting
- search filtering

### Existing tests retained

- `src/components/__tests__/app-shell.test.tsx`
- `src/db/__tests__/bootstrap.test.ts`
- `src/db/__tests__/mappers.test.ts`
- `src/db/__tests__/sqlite-repositories.test.ts`

## Issues Encountered

### 1. Web bundling and SQLite

The app previously failed on web when startup code eagerly imported Expo SQLite.

Resolution already applied before and relied on in Phase 2:

- app startup skips DB initialization on web
- Phase 2 gear logic uses lazy imports so SQLite-backed repositories are not pulled in eagerly during web startup

### 2. Phase 2 introduced new hard-coded colors

New selector and management UI initially introduced direct destructive and overlay color values.

Resolution:

- added those values to `src/theme/colors.ts`
- updated the new UI to use the centralized palette

### 3. Encoding artifacts in newly added text

Some initial UI strings contained non-ASCII/encoding artifacts.

Resolution:

- replaced the affected files with clean ASCII content

## Verification Performed

The following checks passed after implementation:

- `npm run lint`
- `npm test -- --runInBand`
- `npx tsc --noEmit`

## What Was Not Implemented Yet

Phase 2 completed gear registry infrastructure and a first UI surface, but not the full roll/exposure workflows.

Still not implemented:

- roll create/edit screens
- camera and film selector integration into roll management
- previous-selection defaults in the exposure form
- CSV export
- location capture
- polished production UX for gear management

## Resulting Baseline

At the end of Phase 2, the app now has:

- a repository-backed gear registry hook
- a reusable searchable selector component
- quick-create behavior for missing gear items
- recent selection tracking
- a working gear registry management screen
- first real selector integration in the exposure route

This is a valid handoff point for Phase 3, which should build real roll management screens and connect camera and film stock selectors into the roll workflow.
