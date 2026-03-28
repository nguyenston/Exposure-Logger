# Voice Parse Rules

## Purpose

This document defines the current voice-transcript parsing rules for exposure entry.

It is intended for:

- future parser changes
- debugging missed matches
- documenting the current command-style voice UX

The source of truth for the implementation is:

- [src/features/exposures/voice-transcript.ts](c:/Users/phucn/DATA/Projects/repos/exposure-logger/src/features/exposures/voice-transcript.ts)

## Current Model

The parser is intentionally conservative.

It does not try to infer everything from arbitrary free speech. Instead, it looks for a small set of explicit command-style phrases and maps them into structured exposure fields.

Current fields:

- `fStop`
- `shutterSpeed`
- `lens`
- `notes`
- `frame`

Returned shape:

- `transcript`
- `fStop`
- `shutterSpeed`
- `lens`
- `notes`
- `frame`
- `notesMode`
- `matchedFields`

## Normalization

Before matching:

- transcript is lowercased
- punctuation such as `, ; : ! ? ( ) [ ] { }` is removed
- repeated whitespace is collapsed

This means matching is based on normalized spoken text, not raw punctuation or capitalization.

## F-Stop Rules

The parser builds aliases from the currently configured stop-step table.

Examples of accepted patterns:

- `f 2.8`
- `f stop 2.8`
- `fstop 2.8`
- `aperture 2.8`
- `f two point eight`
- `f stop two point eight`
- `aperture two point eight`

The parser also accepts direct option text when it matches a configured wheel value.

Examples:

- `f/2.8`
- `f/8`
- `f/11`

Important behavior:

- matching prefers the longest matching alias
- available values depend on the configured stop increment
- if a spoken value is not in the current option table, it will not be matched

## Shutter Speed Rules

Shutter aliases are also generated from the current stop-step table.

### Fractional shutter examples

Accepted forms include:

- `1/60`
- `1 60`
- `1 over 60`
- `at 60`
- `for 60`
- `shutter 60`
- `speed 60`
- `at sixty`
- `one over sixty`

These map to the configured option, for example:

- `1/60`
- `1/125`
- `1/1000`

### Timed shutter examples

Accepted forms include:

- `2s`
- `2 second`
- `2 seconds`
- `at 2`
- `for 2`
- `shutter 2`
- `speed 2`
- `two seconds`

These map to timed options like:

- `1s`
- `2s`
- `8s`

Important behavior:

- matching prefers the longest matching alias
- available values depend on the configured stop increment
- if the spoken value is not present in the current wheel options, it will not be matched

## Keyword Segments

The parser uses keyword-based extraction before matching.

### F-stop keyword segment

Keyword pattern:

- `f`
- `f stop`
- `fstop`
- `aperture`

If one of those appears, the parser tries to match the text after that keyword first.

### Shutter keyword segment

Keyword pattern:

- `shutter`
- `speed`
- `at`
- `for`

If one of those appears, the parser tries to match the text after that keyword first.

This is why phrases like:

- `f stop 2.8 at 60`

work well in the current parser.

## Lens Rules

Lens is free text, but only when explicitly labeled.

Keyword:

- `lens`
- `lenz`

The parser captures the text after `lens` until one of these stop words:

- `lens`
- `note`
- `notes`

Examples:

- `lens 50mm`
- `lens Voigtlander 40mm`
- `lens Nikon 105 macro`

Important behavior:

- unlabeled free text does not become a lens automatically
- `lens 50mm notes storefront` parses lens as `50mm`

## Notes Rules

Notes are also free text, but only when explicitly labeled.

Keywords:

- `note`
- `notes`

The parser captures everything after `note` or `notes` until the end of the transcript.

Examples:

- `notes storefront at dusk`
- `note underexposed by accident`

Overwrite variants:

- `note overwrite storefront at dusk`
- `notes replace meter reading was off`

Important behavior:

- unlabeled trailing speech does not become notes automatically
- notes are trimmed and whitespace-normalized
- notes default to `append` mode
- if the parser sees `note overwrite` or `note replace`, it switches to `replace` mode and strips that command word from the saved notes text

## Frame Rules

Frame selection is only active on the new-exposure screen.

Keyword:

- `frame`

Accepted examples:

- `frame 6`
- `frame 12`
- `frame six`
- `frame twenty four`
- `frame for`

Important behavior:

- this updates the selected target frame for quick add
- it does not save by itself
- `Add Exposure` / `Insert Exposure` is still the only commit action
- the edit-exposure screen ignores parsed `frame` commands
- the parser also tolerates a few common speech-to-text mistakes for frame numbers, such as `for` -> `4`

## Matching Priority

Field matching is conservative and independent:

- `fStop` tries to match from the aperture keyword segment first
- `shutterSpeed` tries to match from the shutter keyword segment first
- `lens` requires the `lens` keyword
- `notes` requires `note` or `notes`
- `frame` requires the `frame` keyword

The parser then reports which fields matched in `matchedFields`.

## Good Phrase Shapes

The current parser is designed around command-style phrases like:

- `f stop 2.8 at 60`
- `f stop 8 at 125 lens 40mm`
- `aperture two point eight shutter two seconds`
- `frame 6 f stop 5.6 at 125`
- `f stop 5.6 at 250 lens 50mm notes storefront at dusk`

## Known Limitations

- It does not do fuzzy semantic parsing of arbitrary spoken phrases.
- It does not infer lens or notes without explicit keywords.
- It only matches `f-stop` and `shutter speed` values that exist in the current wheel options.
- It does not currently parse ISO, location, roll selection, or save commands.
- Because `at` and `for` are used as shutter keywords, short ambiguous phrases may bias toward shutter parsing.

## Apply Behavior

- Voice transcript apply mode is configurable in Settings.
- The default mode is `Auto-apply`.
- Auto-apply applies any recognized fields, even if only one field matched.
- After auto-apply succeeds, the expanded transcript review UI should collapse back down.
- If no fields were recognized, the form should show a small failure message rather than staying completely silent.

## Design Intent

The current parser favors:

- predictable behavior
- low-risk field application
- explicit command words

It does not favor:

- aggressive inference
- hidden AI-like guessing
- hidden automatic field guessing

That is intentional for the first version.
