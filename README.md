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
- [Repository Guide](./docs/repo-guide.md)
- [Deployment Guide](./docs/deployment-guide.md)

## Development

Common commands:

```bash
npm install
npm run start
npm run lint
npm run test
```

For native-module development and release setup, see:

- [Deployment Guide](./docs/deployment-guide.md)

## Product Notes

- Data is stored locally on the device
- Location is optional
- Voice input is optional and requires a native build, not plain Expo Go
- Full backup import replaces the current local database rather than merging into it

## License / Publishing

If you plan to publish the app publicly, add the final license and store/privacy policy details before release.
