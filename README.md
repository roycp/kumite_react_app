# KumiteApp

A martial arts tournament management platform built with Expo / React Native.

## Overview

KumiteApp lets administrators create and manage tournaments, track registrations, run brackets, and conduct athlete weigh-ins. Athletes can search for tournaments, register in disciplines, and view their history.

**Key features**

- Tournament lifecycle management (Created → Registration Open → Registration Closed → Weigh-In Open → Weigh-In Closed → In Progress → Finished / Cancelled)
- Dynamic role and permission system (admin, manager, coach, athlete, organizer, and custom roles)
- Single-elimination bracket generation with manual seeding
- Athlete weigh-in recording with automatic pass/fail determination
- Multi-discipline registration (Kata, Kumite, Gi, etc.) with weight classes
- Country flags and organization acronyms on participant cards
- Internationalization (Spanish default via i18next)

---

## Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later (comes with Node)
- **Expo CLI** (installed globally or used via `npx`)

```bash
node -v   # should print v18.x or later
npm -v    # should print 9.x or later
```

---

## Installation

```bash
git clone <repo-url>
cd MyFirstApp
npm install
```

---

## Running locally

### Web (recommended for development and E2E testing)

```bash
npx expo start --web
```

The app opens at `http://localhost:8082` by default. All data is stored in `localStorage` (no backend required).

### Mobile (optional)

```bash
# Android emulator (requires Android Studio)
npx expo run:android

# iOS simulator (macOS only, requires Xcode)
npx expo run:ios

# Expo Go (scan QR code in terminal)
npx expo start
```

---

## Running E2E tests

Tests use [Playwright](https://playwright.dev) and run against the Expo web server (port 8082).

```bash
# Run all tests (Playwright auto-starts the web server)
npm run test:e2e

# Run a single spec
npx playwright test e2e/<spec-name>.spec.ts --reporter=line

# Open the interactive Playwright UI
npm run test:e2e:ui

# View the last test report
npm run test:e2e:report
```

> **Important:** If a previous Expo server is still running on port 8082, kill it before running tests:
> ```bash
> # Find and kill stale process (Windows PowerShell)
> netstat -ano | findstr ":8082"
> taskkill /PID <pid> /F
> ```

---

## Project structure

```
app/
  screens/          # All screen components (one file per screen)
  _layout.tsx       # Expo Router stack configuration
components/         # Shared UI components (Sidebar, BracketParticipantCard, etc.)
constants/          # Theme tokens, status labels, country list, permissions
context/            # AuthContext (session, login, register, logout)
db/
  database.web.ts   # AsyncStorage-based DB for web (used by Playwright)
  database.native.ts# Realm-based DB for native (iOS/Android)
data/               # Static tournament and template seed data
e2e/                # Playwright E2E test specs
hooks/              # Shared React hooks (useAuthGuard, usePermission, etc.)
i18n/               # Translation strings (Spanish default)
utils/              # Shared utilities (bracketUtils.ts, etc.)
```

---

## Linting

```bash
npm run lint
```

Uses `eslint-config-expo/flat`. All JSX string literals containing special characters must use HTML entities or Unicode.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Tests hang / timeout on port 8082 | Kill the stale Expo process (see above) and retry |
| `Metro Bundler` crashes on native | Run `npx expo start --clear` to clear the cache |
| `Realm` schema errors on native | Bump `schemaVersion` in `database.native.ts` after any schema change |
| Blank screen after login | Check `db:session_user_id` in `localStorage` (web) or Realm session (native) |
