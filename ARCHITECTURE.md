# Architecture — KumiteApp

## Overview
KumiteApp is a cross-platform React Native / Expo application for martial arts tournament registration and management. Athletes and coaches sync up their profiles and register for tournaments. Coaches can register multiple athletes under them. The app targets iOS, Android, and web. Defaults to Spanish.

## Requirements

```bash
node >= 18  |  npm >= 9
npm install
npx expo start --web        # dev server on http://localhost:8081
npx playwright test         # all E2E tests
```

No mandatory env vars for local development. GitHub SSH key at `~/.ssh/id_ed25519_github` for pushing.

## Frameworks & Key Libraries

| Layer | Library | Version | Purpose |
|-------|---------|---------|---------|
| Cross-platform UI | React Native + Expo SDK | ~54 | Mobile + web |
| Design system | react-native-paper | ^5.15 | Material Design 3 |
| Navigation | expo-router (file-based) | ~6.0 | Screen routing |
| i18n | react-i18next + i18next | latest | Translations (ES default) |
| Async state | @react-native-async-storage/async-storage | latest | Profile & registration persistence |
| E2E testing | Playwright | ^1.58 | Browser automation + recordings |

## Project Structure

```
app/
  _layout.tsx              # Root layout — PaperProvider + Stack navigator + i18n init
  index.tsx                # Redirects to /screens/MainScreen
  screens/
    MainScreen.tsx         # Landing page with 3 nav cards
    SyncUpScreen.tsx       # Profile setup (Athlete or Coach role)
    TournamentSearch.tsx   # Grid of 4 mock tournament tiles
    TournamentDetail.tsx   # Tournament info + Sync Up button
    TournamentManagement.tsx # List of registered tournaments
    FormScreen.tsx         # Registration form (web DOM + native RN-Paper)
i18n/
  index.ts                 # i18next config — language: 'es', fallback: 'en'
locales/
  es.json                  # Spanish translations (default)
  en.json                  # English translations (fallback)
e2e/
  main.spec.ts             # MainScreen tests
  syncup.spec.ts           # SyncUpScreen tests
  tournament-search.spec.ts
  tournament-detail.spec.ts
  tournament-management.spec.ts
  form.spec.ts             # Registration form tests (existing, updated)
docs/
  bug-history.csv          # Persistent bug log
ARCHITECTURE.md            # This file
playwright.config.ts       # video:'on', retries:1
```

## Screens & Navigation

| Route | Screen | Purpose |
|-------|--------|---------|
| `/` | index | Redirects to MainScreen |
| `/screens/MainScreen` | MainScreen | Landing; links to all features |
| `/screens/SyncUpScreen` | SyncUpScreen | Athlete or Coach profile setup |
| `/screens/TournamentSearch` | TournamentSearch | Browse 4 mock tournaments |
| `/screens/TournamentDetail?id=&name=` | TournamentDetail | Tournament info + register |
| `/screens/FormScreen?tournamentId=&tournamentName=` | FormScreen | Registration form |
| `/screens/TournamentManagement` | TournamentManagement | View registrations |

## Data Flow

```
User opens app
  → index.tsx → /screens/MainScreen

MainScreen → tap "Perfil & Registro"
  → SyncUpScreen
    → Select Athlete → fill form → save to AsyncStorage("kumite_profile")
    → Select Coach   → fill coach + N athletes → save to AsyncStorage("kumite_profile")

MainScreen → tap "Buscar Torneos"
  → TournamentSearch (mock data, 4 tiles)
    → tap tile → TournamentDetail?id=X&name=Y
      → tap "Inscribirse"
        → FormScreen?tournamentId=X&tournamentName=Y
          → pre-fills eventName from URL param
          → pre-fills athlete fields from AsyncStorage("kumite_profile")
          → on submit → push to AsyncStorage("kumite_registrations")

MainScreen → tap "Mis Torneos"
  → TournamentManagement
    → reads AsyncStorage("kumite_registrations")
    → shows list or empty state
```

## External Integrations

| Service | Purpose | Credentials |
|---------|---------|-------------|
| GitHub | Private repo `kumite-app` | SSH key `~/.ssh/id_ed25519_github` |
| (future) Tournament API | Fetch live tournament data | TBD |

AsyncStorage on web uses `localStorage` under the hood (React Native Web implementation).

## Testing

```bash
npx playwright test                  # Run all E2E tests + save video recordings
npx playwright test --ui             # Interactive UI mode
npx playwright show-report           # HTML report
```

- Specs: `e2e/*.spec.ts`
- Videos: `test-results/**/*.webm` (video:'on' in config)
- Retries: 1 (configured in playwright.config.ts)

## Known Constraints & Gotchas

### 🚨 Expo Web + Playwright: React useState does NOT update the DOM

**Symptom:** `useState` updates fire (console.log confirms), but the DOM does not re-render in Playwright headless mode.

**Root cause:** Expo's static web output (`"output": "static"`) pre-renders to static HTML. React hydration in the headless browser doesn't process state updates from event handlers the same way as a live dev server with HMR.

**Fix:** Use **pure DOM manipulation** for any web form component tested with Playwright:
```ts
// ✅ Works
const val = (document.getElementById('my-input') as HTMLInputElement).value;
document.getElementById('error-div')!.textContent = 'Error msg';

// ❌ Broken in Playwright headless
const [errors, setErrors] = useState({});
setErrors({ field: 'Error msg' }); // DOM doesn't update
```

### 🚨 button type="submit" causes page navigation in Expo web

**Fix:** Always use `type="button"` with `onClick` handler. Never use `type="submit"` on a form button in Expo web components tested with Playwright.

### react-native-paper TextInput `id` prop

RN-Paper's `TextInput` renders a wrapper div; the `id` prop goes on the wrapper, not the real `<input>`. For Playwright targeting, use a plain HTML `<input>` element instead of `TextInput` in web-only components.
