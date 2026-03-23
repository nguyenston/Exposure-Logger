# Phase 5 Log

## Goal

Implement MVP CSV export with:

- per-roll export
- whole-library export
- export scope settings
- optional auto-archive after successful whole-library export

## What Was Implemented

- Added export settings to app settings storage:
  - `libraryExportScope`
  - `autoArchiveAfterLibraryExport`
- Added per-roll export from roll detail.
- Added whole-library export from the settings screen.
- Added CSV generation and sharing support using Expo file and sharing modules.
- Added tests for:
  - whole-library export scope filtering
  - CSV escaping
  - flattened CSV row generation

## Key Decisions

- MVP export uses one flattened CSV file instead of multiple files.
- Whole-library export defaults to finished rolls only.
- Auto-archive runs only after successful whole-library export.
- Auto-archive only changes exported rolls that were `finished`.

## What Was Not Added

- split export files such as `rolls.csv` and `exposures.csv`
- ZIP packaging
- cloud export integrations
- CSV import/restore
