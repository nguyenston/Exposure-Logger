# Flash And ND Logging

## Goal

Add flash and ND logging to exposure entry without making the quick-add screen taller than a typical phone screen.

The design should preserve the app's core principle:

- fast per-frame entry first
- less-frequently changed metadata tucked away

## UX Direction

### Main exposure form

Keep the always-visible portion focused on the fields that change most often:

- f-stop
- shutter speed
- notes
- voice controls
- submit controls

Move lower-frequency fields into a collapsible revealer, likely labeled `Details`:

- lens
- flash
- flash power
- ND stops
- captured at
- location / GPS

This keeps the main form vertically compact while still allowing richer logging when needed.

## Flash

### Storage model

Flash should be registry-backed gear, like lenses.

Add a new gear type:

- `flash`

For V1, flash registry entries should stay minimal:

- `name`
- maybe `notes` later, but not required for first implementation

Do not add rich flash metadata yet unless a concrete workflow needs it.

### Exposure fields

Each exposure should gain:

- `flash: string | null`
- `flashPower: string | null`

### Form behavior

- `flash` is optional and blankable
- when `flash` is blank:
  - hide `flash power`
  - clear `flashPower`
- when `flash` is set:
  - reveal `flash power`

## Flash Power

### Granularity

Flash power options should use the same stop-step setting already used for aperture and shutter:

- `1`
- `1/2`
- `1/3`

Do not add a separate flash-stop setting for now.

### Display format

Flash power labels should be logged in a human-readable base-plus-offset style.

Examples:

- full stop:
  - `1/1`
  - `1/2`
  - `1/4`
  - `1/8`

- half stop:
  - `1/2`
  - `1/2 + 0.5`
  - `1/4`
  - `1/4 + 0.5`

- third stop:
  - `1/2`
  - `1/2 + 0.3`
  - `1/2 + 0.7`
  - `1/4`

This should be the user-facing and persisted label format for V1.

Avoid more mathematically exact but less readable fraction notation.

### Control type

Use a picker/wheel-like selector, not free text.

This matches the current aperture and shutter interaction model and reduces logging friction.

## ND Filter

### Exposure field

ND should be exposure metadata, not registry-backed gear, for V1.

Add:

- `ndStops: string | null` or `number | null`

Preferred behavior:

- expose it as a numeric stepper / picker inside `Details`
- use the same stop-step setting as aperture, shutter, and flash power

Examples:

- `1`
- `1.5`
- `2`
- `2.3`
- `2.7`

The UI should present this as stop count, not a named filter product.

Reason:

- lower setup burden
- avoids premature filter-registry complexity
- fits the logging use case better than brand/model capture

## Revealer Behavior

### Default state

The `Details` section should default to collapsed.

### Auto-expand

Reasonable behavior:

- remain collapsed on fresh entry
- optionally auto-expand when any nested field already has a value

This is especially useful for edit mode.

## Recommended V1 Scope

Implement:

- new gear type: `flash`
- exposure fields:
  - `flash`
  - `flashPower`
  - `ndStops`
- `Details` revealer on new/edit exposure
- flash power options derived from existing stop-step setting
- ND stop selector/stepper using the same stop-step setting

Defer:

- flash metadata beyond name
- ND registry
- flash sync mode / trigger metadata
- guide number
- multiple flashes
- multiple ND filters or stacking-aware UI
- voice parsing for flash and ND commands

## Design Notes

- If screen height becomes tight, keep `lens` visible only if real-world use shows it changes often enough to justify staying outside `Details`.
- If lens changes are mostly handled by inheritance and occasional edits, it can also live inside `Details`.
- The first implementation should prioritize preserving a one-screen quick-add experience over showing every field at once.
