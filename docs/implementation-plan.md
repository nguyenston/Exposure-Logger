# Exposure Logger Implementation Plan

## 1. Objective

This plan turns the product design into a phased build sequence for an offline mobile app that logs film exposures by roll.

Primary goals:

- ship a usable Android MVP quickly
- keep the architecture simple and local-first
- reduce risk by implementing the highest-value workflows first
- preserve a path to iOS without adding cross-device sync complexity

## 2. Delivery Strategy

The project should be built in phases, with each phase producing a testable milestone.

Guiding principles:

- keep the first release offline-only
- prioritize fast exposure entry over broad feature coverage
- defer integrations and AI features until the core logging workflow is stable
- treat CSV export as the only required portability mechanism for MVP

## 3. Phase 0: Project Setup

### Goals

- create the app foundation
- define code structure and tooling
- make local development repeatable

### Deliverables

- Expo React Native app initialized with TypeScript
- basic folder structure from the design doc
- navigation shell
- linting and formatting setup
- test runner setup
- environment notes in a `README`

### Tasks

- initialize Expo project
- choose routing approach: Expo Router or React Navigation
- add TypeScript config and base path aliases if needed
- add ESLint and Prettier
- add Jest and React Native Testing Library
- create shared type definitions
- create placeholder screens for rolls, roll detail, quick add exposure, settings

### Exit criteria

- app runs locally on Android emulator or device
- navigation boots into a placeholder home screen
- test command runs successfully

## 4. Phase 1: Local Data Layer

### Goals

- establish local persistence
- define stable data models
- isolate database logic behind repositories

### Deliverables

- SQLite setup
- schema for `rolls`, `exposures`, and `gear_registry`
- repository layer for CRUD operations
- seed or fixture support for local development

### Tasks

- wire up `expo-sqlite`
- define schema migrations or initialization scripts
- implement repositories for:
  - rolls
  - exposures
  - gear registry
- define domain types for roll and exposure entities
- implement sequence number generation per roll
- implement timestamp handling and update hooks

### Exit criteria

- app can create, read, update, and delete local records
- exposure sequence numbers increment correctly within a roll
- database access is not coupled directly to UI screens

## 5. Phase 2: Gear Registry and Selectors

### Goals

- make repeated entry fast
- normalize cameras, lenses, and film stocks

### Deliverables

- gear registry CRUD
- searchable selector component
- quick-register flow from selector
- separate gear management screen for rename/delete flows
- recent selection support

### Tasks

- implement `gear_registry` management by type
- build a reusable searchable dropdown component
- add filter text behavior
- add inline `Create "<query>"` behavior when no exact match exists
- save and select newly created gear items in one flow
- keep selector overlays focused on search, selection, and quick-register only
- route rename/delete operations through the dedicated gear management screen
- track recent or last-used selections per context

### UX rules

- selectors must work well with large gear lists
- quick-register should take minimal taps
- gear naming should remain editable after creation
- picker rows should not include inline destructive actions such as trash buttons
- management actions should stay separate so the main selector remains fast and low-risk

### Exit criteria

- users can select existing camera, lens, and film stock values quickly
- users can create missing gear entries from the selector without leaving the form
- users can rename or delete gear from the management screen without cluttering the selection overlay

## 6. Phase 3: Roll Management

### Goals

- support the top-level organizational unit of the app
- enable users to start and manage rolls cleanly

### Deliverables

- rolls list screen
- create roll screen
- edit roll screen
- roll status handling

### Tasks

- implement roll list grouped by status
- build create/edit roll forms
- connect camera and film stock selectors
- add fields for push/pull and notes
- support `active`, `finished`, and `archived` statuses
- create flow should always create `active` rolls; status changes belong in edit flow
- show roll metadata in roll detail

### Exit criteria

- users can create, edit, finish, and archive rolls
- roll detail view loads correctly from persisted data

## 7. Phase 4: Exposure Logging MVP

### Goals

- deliver the core value of the app
- make logging a new exposure fast enough for real-world use

### Deliverables

- quick add exposure flow
- exposure detail/edit screen
- previous-selection defaulting
- per-roll ordered exposure list

### Tasks

- build quick add exposure form
- auto-fill current timestamp
- default exposure fields to the previous exposure's values when available
- allow manual override for all editable fields
- connect lens selector with quick-register
- make exposure default behavior configurable from Settings
- implement wheel-style selectors for `f-stop` and `shutter speed`
- make stop increments configurable (`1`, `1/2`, `1/3`)
- support optional location fields on the exposure form
- use last known location first, then refine with current GPS
- keep exposure save non-blocking while location refinement continues for that specific saved exposure
- render exposures in sequence order
- support editing and deleting exposures

### UX rules

- new exposure should require as little typing as possible
- previous exposure values should be the default behavior, not only suggestions
- settings should control whether f-stop, shutter speed, lens, timestamp, location, and default current GPS fetch are enabled by default on new exposures
- step controls should feel closer to a camera dial than a long list of buttons
- location refinement must update only the exposure that triggered it
- unusual values must still be supported through manual entry

### Exit criteria

- users can log a roll sequentially with minimal repeated input
- users can save an exposure without waiting for GPS refinement
- exposure list and detail views reflect edits correctly

## 8. Phase 5: Location Capture

### Goals

- add optional context without making it mandatory

### Deliverables

- location permission flow
- attach current location to exposure
- last-known-then-refine location strategy
- background-in-foreground refinement for the just-saved exposure
- graceful fallback when permission is denied

### Tasks

- integrate `expo-location`
- request permission only when the user opts in
- capture latitude, longitude, and accuracy
- fetch last known location first when available
- refine with a better current fix when possible
- update only the saved exposure that requested refinement
- show location status in the form
- handle denied, unavailable, or timeout scenarios cleanly

### Exit criteria

- users can add current location to an exposure when desired
- logging still works normally when location is unavailable

## 9. Phase 6: CSV Export

### Goals

- provide reliable data portability for MVP

### Deliverables

- CSV generator
- per-roll export action
- whole-library export action
- export settings for scope and auto-archive behavior
- share or save file flow
- phase log for the export implementation

### Tasks

- define CSV shape for rolls and exposures
- support per-roll export from roll detail
- support whole-library export from settings/export
- whole-library export should include finished rolls by default
- add settings for:
  - whole-library export scope
  - auto-archive after successful whole-library export
  - generate one flattened CSV file from local database records
  - support device share-sheet or file save flow
  - auto-archive exported finished rolls only after successful whole-library export when enabled
  - validate escaping and formatting for notes and special characters

### Recommended export shape

- one flattened CSV file containing roll columns and exposure columns together
- optional later split export or manifest versioning if needed

### Exit criteria

- users can export a single roll reliably from the device
- users can export the whole library reliably from the device
- whole-library export defaults to finished rolls only
- auto-archive after whole-library export works only when enabled and only after successful export
- exported CSV opens correctly in spreadsheet tools

## 10. Phase 7: MVP Hardening

### Goals

- improve reliability, polish, and release readiness

### Deliverables

- validation improvements
- error states and empty states
- export UX polish
- location UX polish
- wheel-picker interaction polish
- core automated tests
- Android release candidate

### Tasks

- add form validation and user-friendly error messages
- improve loading, empty, and failure states
- improve export success/failure messaging
- make export entry points easier to discover where needed
- polish location status text for last-known vs refined GPS
- clarify when a saved exposure is still refining location
- improve location timeout and unavailable-state behavior
- tune wheel-picker settle behavior so slow releases feel consistent
- review keyboard and spacing behavior across core screens
- add unit tests for:
  - sequence numbering
  - selector quick-add behavior
  - CSV export formatting
  - previous-selection defaulting
- add integration tests for roll and exposure CRUD
- test offline behavior on actual device
- produce signed Android build

### Exit criteria

- MVP is stable enough for personal daily use or limited beta testing
- export and location flows are understandable without trial and error
- picker interactions feel consistent on device
- critical flows are covered by automated tests

## 11. Phase 8: iOS Port

### Goals

- validate the same app on iOS with minimal platform-specific divergence

### Deliverables

- iOS build configuration
- permission flow adjustments
- UI fixes for iOS behavior

### Tasks

- test selectors and forms on iOS
- validate file export behavior on iOS
- validate location permission prompts and UX
- address layout or keyboard issues

### Exit criteria

- the same codebase ships on iOS with acceptable UX

## 12. Phase 9: Stretch Features

### Candidate features

- voice transcription for hands-free logging
- parsing spoken exposure strings into structured fields
- export integrations such as Google Drive or Dropbox
- photo attachment
- frame reminders or frame counter assistance

### Recommendation

Do not start this phase until the app has proven that:

- the roll and exposure model is stable
- selector UX works well in real use
- CSV export is sufficient for data portability

## 13. Suggested Build Order Within Each Phase

For each phase:

1. define screen or domain contract
2. implement repository or service support
3. wire UI to real data
4. test edge cases
5. polish interaction details

This avoids building disconnected UI without the underlying domain behavior.

## 14. Risks by Phase

### Highest-risk areas

- selector UX becoming slow or awkward with large gear lists
- selector overlays becoming noisy or error-prone if management and destructive actions are mixed into selection rows
- exposure defaulting rules becoming confusing
- export shape changing late and creating compatibility churn
- adding stretch features before the core logging flow is proven

### Mitigation

- test the quick add flow early on an actual phone
- keep the selector focused on choose/search/create, and keep rename/delete on the gear management screen
- keep export format simple and versionable
- defer transcription and integrations until after MVP stabilization

## 15. Recommended Immediate Next Steps

1. Scaffold the Expo app and base navigation
2. Implement the SQLite schema and repository layer
3. Build the gear registry and searchable selector component
4. Build roll CRUD
5. Build quick exposure logging with previous-selection defaults
6. Add CSV export
