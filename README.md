# Exposure Logger

Phase 0 foundation for an offline mobile app that logs film exposures by roll.

## Stack

- Expo + React Native + TypeScript
- Expo Router for navigation
- `expo-sqlite` with Drizzle ORM for typed data access
- Jest + React Native Testing Library for baseline test coverage

## Commands

- `npm install`
- `npm run start`
- `npm run android`
- `npm run ios`
- `npm run web`
- `npm run lint`
- `npm run test`

## Conventions

- Route files live under `src/app`
- Database schema and client setup live under `src/db`
- App-facing data uses explicit domain types in `src/types`
- Screens and components should use repositories or services, not direct SQLite access

## Phase 0 Scope

- app shell with stable placeholder routes
- typed database foundation
- linting and formatting config
- baseline test setup
