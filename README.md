# Exposure Logger

Offline-first mobile app for film photographers who want to log exposures by roll with as little friction as possible while shooting.

The app is built around a simple workflow:

- create a roll
- add exposures quickly
- keep repeated entry fast with sane autofill and saved drafts
- keep camera/lens/film names consistent with a gear registry
- use voice dictation and volume-button gestures when typing would slow you down
- export roll data or full local backups

## Current Status

The project is functional as an Android-first Expo/React Native app with:

- roll management
- exposure logging
- lens/camera/film registry
- optional GPS tagging
- optional voice-assisted entry
- mid-roll target-frame selection and insertion
- per-roll CSV/PDF export and library CSV export
- full-database JSON backup/export and restore

## Stack

- Expo + React Native + TypeScript
- Expo Router
- `expo-sqlite` + Drizzle ORM
- Jest + React Native Testing Library

## Highlights

- Local-first data model with no account required
- Roll-centric exposure logging flow designed for low-friction entry
- Wheel-style aperture and shutter selectors
- Human-friendly date/time picker for capture timestamps
- Searchable gear selectors with quick-add
- Saved add/edit drafts across navigation
- Sane autofill from previous exposures for lens, shutter speed, and aperture
- Optional voice dictation with hardware volume-button shortcuts
- Target-frame selection for backfilling or mid-roll insertion
- CSV/PDF export for spreadsheet, archive, and print workflows
- JSON backup/restore for full local database portability

## Repository Map

Important docs:

- [Design](./docs/design.md)
- [Implementation Plan](./docs/implementation-plan.md)
- [Export Format](./docs/features/export_format.md)
- [In-App Help](./docs/features/in-app-help.md)
- [Gear Registry](./docs/features/gear-registry.md)
- [Search / Filtering](./docs/features/search-filtering.md)
- [Voice Parse Rules](./docs/features/voice_parse_rules.md)
- [Competitive Notes](./docs/competitive-notes.md)
- [Current Release Notes](./docs/release-notes.md)
- [Repository Guide](./docs/repo-guide.md)
- [Deployment Guide](./docs/deployment-guide.md)
- [Privacy Policy Page](./pages/privacy-policy.html)

## Development

Common commands:

```bash
npm install
npm run start
npm run android
npm run lint
npm run test
```

For native-module development and release setup, see:

- [Deployment Guide](./docs/deployment-guide.md)

## Product Notes

- Data is stored locally on the device
- Location is optional
- Voice input is optional and uses the native development client during local development
- New exposure quick-add can target any frame, and occupied frames insert by shifting later logged frames forward
- Full backup import replaces the current local database rather than merging into it

## License / Publishing

This repository is licensed under the [MIT License](./LICENSE).

If you plan to publish the app publicly, add the final store/privacy policy details before release.

## GitHub Pages

This repo includes a GitHub Actions Pages deploy workflow at [`.github/workflows/deploy-docs.yml`](./.github/workflows/deploy-docs.yml).

It publishes the static files in [`pages/`](./pages/) to GitHub Pages, including:

- [`pages/index.html`](./pages/index.html)
- [`pages/privacy-policy.html`](./pages/privacy-policy.html)
