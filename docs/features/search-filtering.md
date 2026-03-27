# Search and Filtering

## Purpose

Define a practical first version of search and filtering for Exposure Logger.

This feature should help users answer questions like:

- which rolls used a specific camera, lens, or film stock
- which exposures were shot with a certain lens or shutter speed
- what was shot during a certain date range
- which rolls are still active, finished, or archived

The design should stay aligned with the app's current strengths:

- low-friction logging
- local-first storage
- simple, predictable filtering
- no heavyweight archive-management workflow yet

## Product Goal

The first goal is not "full library intelligence."

The first goal is:

- quickly narrow rolls
- quickly narrow exposures within a roll or across the library
- make common comparisons easy

Examples:

- show all rolls shot on `Portra 400`
- show all exposures using `50mm`
- show all finished rolls from the last 30 days
- show all exposures with `1/1000`

## Non-Goals

For the first version, do not try to solve:

- full-text search across every field with ranking
- saved smart collections
- tag systems
- cloud indexing
- archive-folder or Drive-link search
- cross-device sync

Those may come later, but they are not needed for a useful V1.

## Recommended Scope

### V1

Search and filter at two levels:

1. Rolls list filtering
2. Library-wide exposure search

### Rolls list filtering

Allow filtering by:

- status
- camera
- film stock
- shot ISO
- date range

### Library-wide exposure search

Allow filtering by:

- camera
- film stock
- lens
- aperture
- shutter speed
- roll status
- captured date range

Also include:

- free-text search over notes

### V1.5

If V1 lands well, add:

- combined roll + exposure result grouping
- recent filters
- quick chips for common filters

## Recommended UX

### Rolls screen

Add a compact filter/search control above the roll list.

Suggested structure:

- search field
- filter button
- active filter chips

Behavior:

- search text matches roll nickname, camera, film stock, and notes
- filter sheet controls structured filters
- active chips are removable one by one
- a single `Clear all` action resets everything

### Exposure search screen

Add a dedicated screen instead of overloading roll detail.

Suggested route:

- `src/app/search.tsx`

Suggested screen structure:

- top search field
- filter chips row
- filter sheet
- results list grouped by roll

Result row should show:

- frame number
- roll nickname or camera + film stock fallback
- lens
- aperture / shutter
- captured date/time
- short note preview

Pressing a result should open the roll and focus that exposure.

## Why a dedicated search screen

This is cleaner than forcing search into every existing screen.

It keeps:

- roll detail focused on one roll
- roll list focused on roll management
- search focused on retrieval

It also creates a foundation for future archive-style features without polluting the main logging flow.

## Search Model

### Rolls search text

Text search should match:

- `nickname`
- `camera`
- `filmStock`
- `notes`

### Exposure search text

Text search should match:

- `roll.nickname`
- `roll.camera`
- `roll.filmStock`
- `exposure.lens`
- `exposure.notes`

This should be simple substring matching, case-insensitive.

That is enough for V1.

### Structured filters

Use exact or normalized equality where possible:

- status
- camera
- film stock
- lens
- aperture
- shutter speed

Use range comparison for:

- `capturedAt`
- `startedAt`
- `finishedAt`
- `shotIso`

For rolls, prefer roll-owned fields only.

That means:

- camera
- film stock
- shot ISO
- status
- started / finished dates

Do not make lens a roll-list filter in V1.

If native ISO filtering is ever needed later, treat it as film-stock metadata rather than a roll-owned field.

## Data and Query Design

### Current data is already close

Existing fields already support most of V1:

- roll `status`
- roll `camera`
- roll `film_stock`
- roll `shot_iso`
- roll `started_at`
- roll `finished_at`
- roll `notes`
- exposure `lens`
- exposure `f_stop`
- exposure `shutter_speed`
- exposure `captured_at`
- exposure `notes`

### Suggested repository additions

Add explicit search/filter methods rather than forcing screens to compose raw queries.

Suggested contracts:

- `searchRolls(criteria)`
- `searchExposures(criteria)`

Criteria objects should be optional-field based, for example:

```ts
type RollSearchCriteria = {
  query?: string;
  status?: Array<'active' | 'finished' | 'archived'>;
  camera?: string[];
  filmStock?: string[];
  shotIsoMin?: number;
  shotIsoMax?: number;
  startedFrom?: string;
  startedTo?: string;
  finishedFrom?: string;
  finishedTo?: string;
};

type ExposureSearchCriteria = {
  query?: string;
  rollStatus?: Array<'active' | 'finished' | 'archived'>;
  camera?: string[];
  filmStock?: string[];
  lens?: string[];
  fStop?: string[];
  shutterSpeed?: string[];
  capturedFrom?: string;
  capturedTo?: string;
};
```

## Performance Approach

The dataset is likely still small enough for simple SQLite queries.

Recommended V1 approach:

- repository-level SQL `WHERE` clauses for structured filters
- case-insensitive `LIKE` for text search
- straightforward ordering

Add indexes only where clearly helpful.

Likely useful indexes later:

- rolls `(status, updated_at)`
- rolls `(camera)`
- rolls `(film_stock)`
- exposures `(lens)`
- exposures `(captured_at)`

Do not over-index prematurely.

## UI State Rules

### Search should be persistent per screen

If the user leaves and returns:

- rolls screen should remember its last filters during the session
- search screen should remember its last filters during the session

This matches the draft-oriented direction already used elsewhere.

### Empty states

Need distinct empty states:

- no rolls/exposures exist yet
- filters returned no results

The latter should always offer:

- `Clear filters`

## Recommended Build Order

1. define search criteria types
2. add repository search methods
3. build rolls list filtering
4. build dedicated search screen for exposures
5. add chips and clear/reset behavior
6. add persistence of search UI state

## Out of Scope for V1

- folder or project collections
- inventory-aware filtering
- active-camera dashboards
- saved searches
- fuzzy typo correction
- full archive-management fields

## Recommendation

Start with:

- roll list filters
- dedicated exposure search screen

This gives real value without dragging the app into archive-software complexity too early.
