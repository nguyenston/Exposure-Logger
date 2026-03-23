# Phase 3 Implementation Log

## Overview

This document records what actually happened during Phase 3 implementation.

Phase 3 replaced the placeholder roll screens with a real roll management flow and aligned the codebase with the updated film-speed model: `nativeIso` and `shotIso` live on the roll, and push/pull is derived from their difference.

## Status

Completed.

## Goals

- implement real roll CRUD flows
- update the codebase to use `nativeIso` and `shotIso` instead of `pushPull`
- connect camera and film stock selectors to real roll forms
- replace the placeholder rolls list with a working screen

## What Was Implemented

### 1. Roll model update

Updated:

- `src/types/domain.ts`
- `src/db/schema.ts`
- `src/db/mappers.ts`
- `src/db/repositories/sqlite-roll-repository.ts`

Changes:

- roll model now stores `nativeIso` and `shotIso`
- roll-level `pushPull` was removed from the domain model
- exposure-level `pushPullOverride` was also removed from the domain model and repository input shape
- roll repository create/update paths now persist ISO fields

### 2. Database bootstrap migration

Updated:

- `src/db/bootstrap.ts`

Changes:

- database version moved from `1` to `2`
- fresh installs create the current roll schema directly
- existing version `1` databases receive an additive migration for `native_iso` and `shot_iso`

Implementation note:

- the old `push_pull` column may still remain on older local databases, but it is now ignored by the app
- this was intentional to keep the migration simple and non-destructive

### 3. Roll utilities and hooks

Added:

- `src/features/rolls/roll-utils.ts`
- `src/features/rolls/use-rolls.ts`

Behavior added:

- derive push/pull label from ISO difference
- format ISO display text
- group rolls by status
- load all rolls
- load a single roll by ID
- create, update, and delete rolls through lazy repository imports

Default chosen:

- multiple active rolls are allowed
- `startedAt` defaults to the current time on creation

### 4. Reusable roll form

Added:

- `src/features/rolls/roll-form.tsx`

Behavior added:

- camera selector backed by gear registry
- film stock selector backed by gear registry
- native ISO and shot ISO numeric inputs
- derived push/pull preview
- notes input
- status selector
- create/edit shared form logic
- delete action support for edit mode

### 5. Real roll screens

Added or replaced:

- `src/app/index.tsx`
- `src/app/rolls/new.tsx`
- `src/app/rolls/[rollId].tsx`
- `src/app/rolls/[rollId]/edit.tsx`

Behavior added:

- home screen is now a real rolls list grouped by `active`, `finished`, and `archived`
- users can create a new roll
- users can view roll details
- users can edit or delete a roll
- roll detail shows:
  - camera
  - film stock
  - formatted ISO summary
  - derived push/pull label
  - status
  - start date
  - notes

The detail screen still leaves exposures as a later-phase concern.

### 6. Router updates

Updated:

- `src/app/_layout.tsx`

Changes:

- added routes for:
  - `rolls/new`
  - `rolls/[rollId]/edit`

### 7. Selector integration adjustment

Updated:

- `src/components/gear-selector.tsx`
- `src/app/exposures/new.tsx`

Change:

- selector display state now works with string values instead of requiring a full selected gear object

This made the selector much easier to use in forms that ultimately persist gear names on the roll.

## Testing

### Added tests

- `src/features/rolls/__tests__/roll-utils.test.ts`

Covered behaviors:

- push/pull derivation from ISO difference
- ISO summary formatting
- roll grouping by status
- create flow later simplified to always start new rolls as `active`; status remains editable on the edit screen

### Updated tests

- `src/db/__tests__/sqlite-repositories.test.ts`
- `src/db/__tests__/bootstrap.test.ts`

Changes:

- roll repository tests now use `nativeIso` and `shotIso`
- bootstrap test now expects schema version `2`

### Existing tests retained

- gear utility tests
- app shell test
- DB mapper test

## Issues Encountered

### 1. Design and code were temporarily out of sync

The design doc was updated to use `nativeIso` and `shotIso` before the codebase was migrated.

Resolution:

- Phase 3 explicitly aligned the code with the updated design before building the roll UI

### 2. Migration strategy had to stay additive

Older local databases could already contain the previous `push_pull` roll column.

Resolution:

- used an additive migration for the new ISO columns
- left the old column untouched rather than attempting a destructive SQLite table rewrite

### 3. Selector component originally assumed object-valued display state

That made roll form integration awkward because roll records store gear names, not full gear objects.

Resolution:

- updated `GearSelector` to accept a string display value while still returning the selected gear item on change

## Verification Performed

The following checks passed after implementation:

- `npm run lint`
- `npm test -- --runInBand`
- `npx tsc --noEmit`

## What Was Not Implemented Yet

Phase 3 completed roll management, but not the exposure workflow.

Still not implemented:

- real exposure list under roll detail
- exposure create/edit persistence from the main roll flow
- previous-selection defaulting in the full exposure form
- CSV export
- location capture

## Resulting Baseline

At the end of Phase 3, the app now has:

- a real rolls home screen
- create/edit/detail/delete roll flows
- camera and film stock selectors integrated into roll forms
- roll ISO modeled as `nativeIso` plus `shotIso`
- derived push/pull displayed in the UI
- roll CRUD backed by the existing repository layer

This is a valid handoff point for Phase 4, which should connect roll detail to real exposure logging and make the exposure workflow fast enough for actual field use.
