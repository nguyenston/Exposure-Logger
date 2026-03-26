# Exposure Logger

Offline-first mobile app for film photographers who want to log exposures by roll while shooting.

The app is built around a simple workflow:

- create a roll
- add exposures quickly
- keep camera/lens/film names consistent with a gear registry
- optionally capture GPS and voice notes
- export roll data or full local backups

## Current Status

The project is functional as an Android-first Expo/React Native app with:

- roll management
- exposure logging
- lens/camera/film registry
- optional GPS tagging
- optional voice-assisted entry
- per-roll and library CSV export
- full-database JSON backup/export and restore

## Stack

- Expo + React Native + TypeScript
- Expo Router
- `expo-sqlite` + Drizzle ORM
- Jest + React Native Testing Library

## Highlights

- Local-first data model with no account required
- Roll-centric exposure logging flow
- Wheel-style aperture and shutter selectors
- Searchable gear selectors with quick-add
- Optional speech-driven exposure entry
- CSV export for spreadsheet/script workflows
- JSON backup/restore for full local database portability

## Repository Map

Important docs:

- [Design](./docs/design.md)
- [Implementation Plan](./docs/implementation-plan.md)
- [Export Format](./docs/export_format.md)
- [Voice Parse Rules](./docs/voice_parse_rules.md)
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
- Full backup import replaces the current local database rather than merging into it

## License / Publishing

This repository is licensed under the [MIT License](./LICENSE).

If you plan to publish the app publicly, add the final store/privacy policy details before release.

## GitHub Pages

This repo includes a GitHub Actions Pages deploy workflow at [`.github/workflows/deploy-docs.yml`](./.github/workflows/deploy-docs.yml).

It publishes the static files in [`pages/`](./pages/) to GitHub Pages, including:

- [`pages/index.html`](./pages/index.html)
- [`pages/privacy-policy.html`](./pages/privacy-policy.html)
