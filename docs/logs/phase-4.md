# Phase 4 Log

## Goal

Implement the real exposure logging flow:

- create exposures against a roll
- show ordered exposures on roll detail
- support exposure edit/delete
- make default exposure behavior configurable from Settings

## What Landed

- Added persisted app settings for exposure defaults via a new `app_settings` table.
- Added a settings hook and replaced the Settings placeholder with real toggles for:
  - reuse previous `f-stop`
  - reuse previous `shutter speed`
  - reuse previous `lens`
  - default timestamp to now
  - enable the location section by default
  - default location to current GPS
  - stop increment (`1`, `1/2`, `1/3`)
- Added exposure hooks for:
  - list by roll
  - load one exposure
  - create
  - update
  - delete
  - focus-based reload
- Replaced free-text `f-stop` and `shutter speed` inputs with wheel-style step selectors.
- Added current GPS capture in the exposure form with:
  - manual `Use Current Location`
  - auto-fetch when settings enable it
  - last-known-first fill
  - current GPS refinement
- Added post-save location refinement so a saved exposure can be updated with a better fix afterward.
- Replaced the placeholder exposure screen with a real `New Exposure` flow.
- Added an `Edit Exposure` screen.
- Replaced the roll detail exposure placeholder with a real ordered exposure list and `Add Exposure` link.

## Important Decisions

- Exposure default behavior is now driven by Settings instead of being hard-coded.
- `f-stop` and `shutter speed` now use wheel-style controls, with increment size configured in Settings.
- Location defaults now include both:
  - whether the location section starts enabled
  - whether current GPS should be fetched automatically
- GPS uses a smoother strategy:
  - last known location first
  - then refine with a better current fix
- Exposure save is non-blocking with respect to GPS refinement.
- Location refinement is keyed to the created exposure id, so only that exposure is patched later.
- The roll detail screen is the primary place to add a new exposure, but `exposures/new` can still be opened directly and will let the user choose an active roll.

## Files Added

- `src/types/settings.ts`
- `src/db/repositories/app-settings-repository.ts`
- `src/db/repositories/sqlite-app-settings-repository.ts`
- `src/features/settings/use-exposure-defaults-settings.ts`
- `src/features/exposures/use-exposures.ts`
- `src/features/exposures/exposure-form.tsx`
- `src/features/exposures/exposure-utils.ts`
- `src/features/exposures/use-current-location.ts`
- `src/features/exposures/refine-exposure-location.ts`
- `src/app/exposures/[exposureId]/edit.tsx`
- `src/components/horizontal-radio-picker.tsx`
- `src/components/gear-icon.tsx`
- `src/store/current-location-store.ts`

## Files Updated

- `src/db/schema.ts`
- `src/db/bootstrap.ts`
- `src/app/settings.tsx`
- `src/app/exposures/new.tsx`
- `src/app/rolls/[rollId]/index.tsx`
- `src/app/_layout.tsx`
- `docs/design.md`
- `docs/implementation-plan.md`

## Verification

- `npm run lint`
- `npm test -- --runInBand`
- `npx tsc --noEmit`

## Remaining Gaps

- True background refinement after app suspension still belongs to a later phase.
- Exposure form validation is intentionally light and should be hardened later.
- There is still no dedicated exposure detail screen separate from edit; edit currently serves as the detailed view.
