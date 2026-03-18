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
- recent selection support

### Tasks

- implement `gear_registry` management by type
- build a reusable searchable dropdown component
- add filter text behavior
- add inline `Create "<query>"` behavior when no exact match exists
- save and select newly created gear items in one flow
- track recent or last-used selections per context

### UX rules

- selectors must work well with large gear lists
- quick-register should take minimal taps
- gear naming should remain editable after creation

### Exit criteria

- users can select existing camera, lens, and film stock values quickly
- users can create missing gear entries from the selector without leaving the form

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
- allow optional push/pull override per exposure
- render exposures in sequence order
- support editing and deleting exposures

### UX rules

- new exposure should require as little typing as possible
- previous exposure values should be the default behavior, not only suggestions
- unusual values must still be supported through manual entry

### Exit criteria

- users can log a roll sequentially with minimal repeated input
- exposure list and detail views reflect edits correctly

## 8. Phase 5: Location Capture

### Goals

- add optional context without making it mandatory

### Deliverables

- location permission flow
- attach current location to exposure
- graceful fallback when permission is denied

### Tasks

- integrate `expo-location`
- request permission only when the user opts in
- capture latitude, longitude, and accuracy
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
- export action from settings
- share or save file flow

### Tasks

- define CSV shape for rolls and exposures
- decide whether to export one file or multiple files
- generate CSV from local database records
- support device share-sheet or file save flow
- validate escaping and formatting for notes and special characters

### Recommended export shape

- `rolls.csv`
- `exposures.csv`
- optional later manifest if versioning is needed

### Exit criteria

- users can export their data reliably from the device
- exported CSV opens correctly in spreadsheet tools

## 10. Phase 7: MVP Hardening

### Goals

- improve reliability, polish, and release readiness

### Deliverables

- validation improvements
- error states and empty states
- core automated tests
- Android release candidate

### Tasks

- add form validation and user-friendly error messages
- improve loading, empty, and failure states
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
- exposure defaulting rules becoming confusing
- export shape changing late and creating compatibility churn
- adding stretch features before the core logging flow is proven

### Mitigation

- test the quick add flow early on an actual phone
- keep export format simple and versionable
- defer transcription and integrations until after MVP stabilization

## 15. Recommended Immediate Next Steps

1. Scaffold the Expo app and base navigation
2. Implement the SQLite schema and repository layer
3. Build the gear registry and searchable selector component
4. Build roll CRUD
5. Build quick exposure logging with previous-selection defaults
6. Add CSV export
