# Gear Registry

## Purpose

Define a practical metadata model for the gear registry without overcomplicating data entry.

The goal is:

- keep selection fast during logging
- support better filtering later
- keep the schema tolerant of messy real-world naming

## Registry Scope

The registry should stay lightweight, but it does not need to be identical for every gear type.

Recommended split:

- cameras: name-first with light identity metadata
- lenses: richer optional metadata
- film stocks: light optional metadata

## Camera Fields

Camera metadata should stay minimal.

Suggested fields:

- `name`
- `nickname`
- `notes`

Recommended display rule:

- if `nickname` exists, show `nickname (name)`
- otherwise, show `name`

This is mainly for disambiguating multiple bodies of the same model without turning camera records into a heavy catalog.

## Lens Fields

All fields should be plain text for the first version.

Suggested fields:

- `name`
- `focalLength`
- `maxAperture`
- `mount`
- `serialOrNickname`
- `notes`

Examples:

- `name`: `Nikkor Auto PC 105mm f/2.5`
- `focalLength`: `105mm` or `24-70mm`
- `maxAperture`: `f/2.5` or `f/3.5-4.5`
- `mount`: `Nikon F`, `M42`, `Leica M`
- `serialOrNickname`: `421xxx`, `CLA 2024`, `beat-up copy`

## Film Stock Fields

Film stock should also stay plain text.

Suggested fields:

- `name`
- `nativeIso`
- `notes`

Examples:

- `name`: `Portra 400`
- `nativeIso`: `400`
- `name`: `HP5 Plus 400`
- `nativeIso`: `400`

`shotIso` should still remain a roll-level value.

Reason:

- `nativeIso` is a stock property
- `shotIso` is a per-roll shooting decision

## Why Plain Text

Plain text is the right tradeoff for now because:

- vintage/manual lenses are inconsistent
- zooms and adapted lenses are messy to normalize
- film stock naming varies across brands and eras
- export/import stays simple
- entry friction stays low

## Required vs Optional

Recommended:

- `name` required for all gear
- everything else optional

This keeps the registry usable even when the user only wants quick naming consistency.

## Smart Autofill

Only one layer of smart parsing is recommended.

### Lens autofill

- parse `name`
- auto-fill `focalLength`
- auto-fill `maxAperture`

Do not auto-derive:

- `mount`
- `serialOrNickname`
- `notes`

### Film stock autofill

- parse `name`
- auto-fill `nativeIso`

That is enough.

Current parsing rule:

- parse a terminal stock-speed token in the form `###`, `###T`, or `###D`
- examples:
  - `Vision3 500` -> `500`
  - `Vision3 500T` -> `500`
  - `Vision3 50D` -> `50`
- only the final token is considered
- names without a terminal speed token are not auto-parsed

## Autofill Behavior

Recommended rules:

1. User enters or edits the gear `name`.
2. App tries to parse the relevant helper metadata.
3. App only auto-fills fields that are currently blank.
4. Manual user edits always win.
5. Later name edits should not silently overwrite manually edited metadata.

### Camera quick-create parsing

Camera quick-create should support the same syntax as the display format:

- `nickname (name)`

Examples:

- `Black F3 (Nikon F3)`
- `Travel body (Olympus XA)`

Parsing rule:

- if the typed value matches `nickname (name)`, parse both fields
- otherwise, treat the whole input as `name`
- if either side is empty after trimming, fall back to plain `name`

This keeps quick-create and display mentally aligned.

## Picker vs Registry UX

Keep selectors minimal.

Recommended split:

- picker = search, select, quick-create
- registry = richer metadata editing

Suggested create flow:

1. User types a new gear name in the picker.
2. Picker offers `Create "<name>"`.
3. App creates a minimal record immediately.
4. App auto-fills helper metadata from the name if possible.
5. Any richer metadata is edited later in the registry screen.

Recommended rule:

- do not open a full metadata form from the picker by default

Reason:

- this keeps exposure entry low-friction
- avoids interrupting logging with admin-style data entry
- matches the app's current quick-add philosophy

Optional enhancement later:

- after quick-create, expose a lightweight `Edit details in registry` path
- but do not require it during selection

## Camera Identity Rules

Recommended uniqueness rule for cameras:

- two camera entries cannot share the same `(name, nickname)` pair

That means:

- same `name` with different nicknames is allowed
- same `nickname` with different names is allowed
- same `name` and same `nickname` should be rejected

Implementation should normalize before comparison:

- trim whitespace
- treat empty nickname as `null`
- compare case-insensitively

## Camera Loading Safeguard

When selecting a camera on `New Roll`:

- if that camera already has an `active` roll
- show a warning confirmation before continuing

Recommended behavior:

- do not hard-block selection
- warn to prevent accidental double-loading

Suggested confirmation:

- `This camera already has an active roll loaded. Start another roll on this camera anyway?`

Recommended actions:

- `Cancel`
- `Continue`

Useful detail to include when available:

- the active roll nickname
- or the currently loaded film stock

Scope:

- only warn for `active` rolls
- no warning for `finished` or `archived` rolls
- apply this on new-roll camera selection, not every camera reference in the app

## Why Keep `maxAperture`

`maxAperture` is still useful even though exposures already store shot `fStop`.

They are different:

- `maxAperture` = lens capability
- `fStop` = per-exposure shot value

`maxAperture` is useful for:

- filtering lenses
- comparing lenses
- richer display later

But it should remain optional, not a required part of the logging flow.

## Recommendation

First implementation should be:

- plain-text metadata
- `name` required, helper metadata optional
- light parsing from `name` into:
  - lens `focalLength`
  - lens `maxAperture`
  - film stock `nativeIso`

That gives real convenience without turning the registry into a heavy cataloging system.
