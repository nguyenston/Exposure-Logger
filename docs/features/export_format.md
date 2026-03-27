# Export Format

## Purpose

This document defines the current export contracts for the app.

It is intended for:

- future import tooling
- EXIF/XMP sidecar scripts
- spreadsheet workflows
- compatibility checks when export behavior changes

It covers:

- flattened CSV export
- printable per-roll PDF export
- full-database JSON backup export/import

## Current MVP Shape

MVP export produces **one flattened CSV file** per export action.

That means:

- per-roll export produces one CSV file for that roll
- whole-library export produces one CSV file for the selected library scope
- each CSV row contains both roll-level and exposure-level columns

## Export Scopes

### Per-roll export

- available from roll detail
- may export any roll status
- exports only the selected roll and its exposures

### Whole-library export

- available from Settings
- defaults to `finished` rolls only
- optional scope includes `finished` and `archived`
- may auto-archive exported `finished` rolls after successful export

### Per-roll PDF export

- available from roll detail through the share/export action
- may export any roll status
- exports only the selected roll and its exposures
- produces a human-readable archive sheet intended for printing or binder storage

## File Format

- format: CSV
- delimiter: comma `,`
- text encoding: UTF-8
- line ending: `\n`
- quote escaping: embedded `"` becomes `""`
- fields containing commas, quotes, or newlines are wrapped in quotes

## PDF Format

- format: PDF
- scope: per-roll only
- paper target: US Letter-sized printable page
- content:
  - roll title, film, camera, status
  - ISO and push/pull context
  - roll started/finished timestamps
  - roll notes
  - exposure table with frame, f-stop, shutter, lens, EV, captured time, and location
- purpose: human-readable archival/print workflow rather than machine-readable import

## Column Order

The current column order is:

1. `rollId`
2. `rollNickname`
3. `rollStatus`
4. `camera`
5. `filmStock`
6. `nativeIso`
7. `shotIso`
8. `rollStartedAt`
9. `rollFinishedAt`
10. `rollNotes`
11. `exposureId`
12. `exposureSequenceNumber`
13. `fStop`
14. `shutterSpeed`
15. `lens`
16. `latitude`
17. `longitude`
18. `locationAccuracy`
19. `capturedAt`
20. `exposureNotes`

## Column Semantics

### Roll columns

- `rollId`
  Stable internal roll identifier.
- `rollNickname`
  Optional user-facing roll name. Empty string if missing.
- `rollStatus`
  One of `active`, `finished`, `archived`.
- `camera`
  Camera name as stored on the roll.
- `filmStock`
  Film stock name as stored on the roll.
- `nativeIso`
  Box speed for the film. Empty string if unset.
- `shotIso`
  Effective shooting ISO for the roll. Empty string if unset.
- `rollStartedAt`
  ISO timestamp when present. Empty string if unset.
- `rollFinishedAt`
  ISO timestamp when present. Empty string if unset.
- `rollNotes`
  Freeform roll notes. Empty string if missing.

### Exposure columns

- `exposureId`
  Stable internal exposure identifier.
- `exposureSequenceNumber`
  Frame sequence number within the roll.
- `fStop`
  Exposure aperture label as entered/selected in the app.
- `shutterSpeed`
  Exposure shutter label as entered/selected in the app.
- `lens`
  Optional lens name. Empty string if missing.
- `latitude`
  Decimal latitude. Empty string if missing.
- `longitude`
  Decimal longitude. Empty string if missing.
- `locationAccuracy`
  Reported location accuracy value. Empty string if missing.
- `capturedAt`
  ISO timestamp for the exposure capture time.
- `exposureNotes`
  Freeform exposure notes. Empty string if missing.

## Row Rules

- If a roll has exposures, there is one CSV row per exposure.
- Roll-level fields are repeated for each exposure row on that roll.
- If a roll has no exposures, the export still includes one row for that roll.
  Exposure-specific columns are empty strings in that row.

## Null / Empty Handling

- `null` values are exported as empty strings
- missing optional text values are exported as empty strings
- missing optional numeric values are exported as empty strings

This is intentional so scripts can distinguish:

- present numeric/text values
- absent data without a literal `null` token

## Time Format

Current exported timestamps are stored as the app's raw ISO-style strings:

- `rollStartedAt`
- `rollFinishedAt`
- `capturedAt`

Scripts should treat them as machine-readable timestamp strings, not locale-formatted display text.

## Location Format

Location fields are exported as raw numeric strings:

- `latitude`
- `longitude`
- `locationAccuracy`

No additional geocoding or place-name expansion is included in MVP export.

## EXIF / Script Notes

This flattened format is intended to work well with future metadata scripts because each row already contains:

- roll context
- frame sequence
- exposure settings
- timestamp
- optional location
- optional notes

For a future EXIF/XMP workflow, likely useful mapping keys are:

- `rollId`
- `exposureSequenceNumber`
- `capturedAt`
- `latitude`
- `longitude`
- `lens`
- `fStop`
- `shutterSpeed`

## Stability Notes

This document describes the **current MVP export contract**.

If the export format changes later, recommended next step is:

- add an explicit export format version field or sidecar manifest

Until then, downstream scripts should assume this format is stable within the current project phase, but subject to future revision.

## Full Backup Format

### Purpose

The app also supports a full-database JSON backup for device-to-device restore and local backup.

This is distinct from CSV:

- CSV is for portability and downstream spreadsheet/script workflows
- JSON backup is for restoring the app's local database state

### Backup Scope

The JSON backup includes:

- all rolls
- all exposures
- all gear registry items
- all persisted app settings

### Backup Behavior

- export produces one JSON file
- import expects a JSON backup file previously exported by the app
- import replaces the current local database rather than merging into it
- import is confirmed as a destructive action before execution

### Top-Level Shape

Current top-level JSON shape:

- `version`
- `exportedAt`
- `rolls`
- `exposures`
- `gear`
- `settings`

### Versioning

Current full-backup version:

- `1`

If backup shape changes later, the version field is the compatibility gate for restore behavior.
