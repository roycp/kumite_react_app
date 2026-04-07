# KumiteApp — Execution Plan for Steps 1, 2, 3
**Target model:** Qwen 2.5 (Ollama)  
**Prepared by:** Claude  
**Project root:** `c:\Users\royal\Documents\Projects\MyFirstApp`  
**Framework:** React Native + Expo SDK 54, web target only, no CSS files — all styles are inline JS objects  
**Test runner:** Playwright (`npm run test:e2e`)  
**Dev server:** `npm run web` → http://localhost:8082

---

## How to read this document

Each step has four sections:
1. **Context** — what exists and why it is broken
2. **Changes** — exact file paths, line numbers, and code to write
3. **Verify** — Playwright test code to add
4. **Debug** — what to do if it goes wrong

Do NOT skip to code. Read Context first or you will misunderstand the architecture.

---

## Architecture Quick Reference

```
app/
  _layout.tsx              ← root layout, wraps everything in AuthProvider + PaperProvider
  screens/
    HomeScreen.tsx         ← login/signup landing (no Sidebar)
    MainScreen.tsx         ← dashboard (uses Sidebar)
    TournamentSearch.tsx   ← browse tournaments (uses Sidebar)
    TournamentDetail.tsx   ← single tournament (uses Sidebar)
    TournamentManagement.tsx ← active registrations (uses Sidebar)
    TournamentHistory.tsx  ← past registrations (uses Sidebar)
    ProfileScreen.tsx      ← user profile (uses Sidebar)
    FormScreen.tsx         ← registration wizard (NO Sidebar — standalone page)
    OnboardingScreen.tsx   ← signup wizard (NO Sidebar)
components/
  Sidebar.tsx              ← left nav used by all authenticated screens
db/
  database.web.ts          ← AsyncStorage JSON store (used in browser)
  database.native.ts       ← Realm store (used on iOS/Android)
data/
  tournaments.ts           ← static tournament catalog, helper functions
e2e/                       ← Playwright tests
```

### Sidebar layout structure (critical to understand)
```html
<!-- Sidebar.tsx renders this DOM structure -->
<style>/* responsive CSS classes */<style>

<div class="shell" style="display:flex; min-height:100vh; position:relative">

  <!-- Desktop: always visible fixed sidebar (240px wide) -->
  <div class="kb-desktop-sidebar" style="width:240px; position:fixed; top:0; left:0; bottom:0">
    ...nav items...
  </div>

  <!-- Mobile: hamburger top bar (position:fixed, height:56px) -->
  <div class="kb-top-bar" style="display:none; position:fixed; top:0; left:0; right:0; height:56px">
    ☰ KumiteApp
  </div>

  <!-- Mobile: slide-in drawer -->
  <div class="mobile-sidebar" style="position:fixed; left:-240px; ...">
    ...nav items...
  </div>

  <!-- Page content area -->
  <div class="kb-content" style="margin-left:240px; flex:1; min-width:0">
    {children}  ← each screen renders its own page div here
  </div>

</div>
```

Responsive CSS in Sidebar.tsx already switches layout at 767px:
```css
@media (max-width: 767px) {
  .kb-desktop-sidebar { display: none !important; }
  .kb-top-bar         { display: flex !important; }
  .kb-content         { margin-left: 0 !important; padding-top: 56px; }
}
```

### Inline style convention
All styles are plain JS objects inside the component, named `s` or `S`.
```tsx
const s: any = {
  page: { minHeight: '100vh', background: '#f5f5f5', padding: '32px 24px', overflowY: 'auto' },
  card: { background: '#fff', borderRadius: 14, padding: 24 },
};
return <div style={s.page}><div style={s.card}>...</div></div>;
```

To add responsive behavior, the app uses `<style>` tags with CSS class names (same pattern as Sidebar):
```tsx
<>
  <style>{`
    @media (max-width: 600px) {
      .kb-my-class { font-size: 14px !important; }
    }
  `}</style>
  <div className="kb-my-class" style={{ fontSize: 18 }}>...</div>
</>
```

### localStorage data injection (used in ALL Playwright tests)
Tests do NOT go through the UI for auth. They inject data directly into localStorage before the page loads:
```ts
await page.addInitScript(() => {
  localStorage.setItem('db:users',           JSON.stringify([user]));
  localStorage.setItem('db:session_user_id', user.id);
  localStorage.setItem('db:registrations',   JSON.stringify([reg1, reg2]));
});
```

### Key data-testid attributes (reference)
```
[data-testid="main-screen"]                 ← MainScreen root
[data-testid="tournament-search-screen"]    ← TournamentSearch root
[data-testid="tournament-management-screen"] ← TournamentManagement root
[data-testid="tournament-history-screen"]   ← TournamentHistory root
[data-testid="profile-screen"]              ← ProfileScreen root
[data-testid="home-screen"]                 ← HomeScreen root (home mode)
[data-testid="nav-search"]                  ← quick tile → TournamentSearch
[data-testid="nav-management"]              ← quick tile → TournamentManagement
[data-testid="nav-history"]                 ← quick tile → TournamentHistory
[data-testid="nav-profile"]                 ← quick tile → ProfileScreen
[data-testid="sidebar-home"]                ← sidebar nav item
[data-testid="sidebar-profile"]             ← sidebar nav item
[data-testid="sidebar-search"]              ← sidebar nav item
[data-testid="sidebar-active"]              ← sidebar nav item
[data-testid="sidebar-history"]             ← sidebar nav item
[data-testid="history-list"]                ← TournamentHistory list container
[data-testid="history-item-0"]              ← first history card
[data-testid="registration-list"]           ← TournamentManagement list container
[data-testid="modality-entry-0-0"]          ← first modality on first registration
```

---

## Step 1 — Responsive Layout (320px–1280px, no horizontal scroll)

### 1.1 Context — what is broken and why

The app renders only on web (`npm run web`). All styles are inline JS objects. The breakpoints to support:
- **Small mobile:** 320px × 568px, 360px × 640px (portrait)
- **Medium mobile:** 375px × 812px, 390px × 844px (portrait)
- **Landscape tablet:** 1024px × 768px, 1280px × 800px

**Root cause of horizontal scroll:** The browser creates a horizontal scrollbar when ANY element's rendered width exceeds the viewport width. On narrow screens the following specific elements overflow:

| File | Line | Problem |
|------|------|---------|
| `TournamentSearch.tsx` | line 48 | `grid: minmax(280px, 1fr)` — 280px minimum means on a 320px screen (with 48px page padding = 272px available content width) the grid column is wider than the container, causing overflow |
| `ProfileScreen.tsx` | line 73 | `row: { gridTemplateColumns: '1fr 1fr' }` — fixed two-column grid. On 320px with 48px padding = 272px available. Each column = 128px, which is tight but ok. However the input inside has `width: 100%` in a 128px column — that is fine. The REAL issue is that on very small screens label text wraps awkwardly and fields are too cramped |
| `MainScreen.tsx` | line 53 | `quickGrid: minmax(200px, 1fr)` — on 320px with 48px padding = 272px. One 200px column fits but barely. On 360px it fits better. Should change to `minmax(160px, 1fr)` |
| `TournamentManagement.tsx` | line ~100 | `btnRow: { display: 'flex', gap: 8 }` — two buttons side by side. On small screens the "✏️ Editar" and "✕ Cancelar" buttons can overflow the card header row |
| `FormScreen.tsx` | line 23 | `card: { padding: 32 }` — 32px left+right = 64px inner padding. Combined with `page: { padding: 16 }` outer = 96px total horizontal padding. On 320px, content width = 224px (fine). On 360px = 264px (fine). BUT the card has no `boxSizing: 'border-box'` — it uses `content-box` so its total rendered width = own width + 64px padding. Since it's a block element it adapts, but nested elements can still overflow |
| `FormScreen.tsx` | line 43 | `grid3: minmax(160px, 1fr)` — on 320px with 64px page+card padding, available content = 224px. 160px minimum × 1 column = 160px — fits. But if card also has margin, it can push over |
| `Sidebar.tsx` | shell | No `overflowX: 'hidden'` on shell div. Any overflowing child creates a horizontal scrollbar on the whole page |

### 1.2 Changes — exact modifications

#### File 1: `components/Sidebar.tsx`

**Goal:** prevent horizontal overflow from propagating to page level.

Find the `shell` style object (around line 52):
```js
// BEFORE
shell: { display: 'flex', minHeight: '100vh', fontFamily: 'Roboto, sans-serif', position: 'relative' as const },
```
Change to:
```js
// AFTER
shell: { display: 'flex', minHeight: '100vh', fontFamily: 'Roboto, sans-serif', position: 'relative' as const, overflowX: 'hidden' },
```

Also update the existing `<style>` tag (around line 107) to add a mobile overflow rule:
```tsx
// BEFORE
<style>{`
  @media (max-width: 767px) {
    .kb-desktop-sidebar { display: none !important; }
    .kb-top-bar         { display: flex !important; }
    .kb-content         { margin-left: 0 !important; padding-top: 56px; }
  }
`}</style>

// AFTER
<style>{`
  @media (max-width: 767px) {
    .kb-desktop-sidebar { display: none !important; }
    .kb-top-bar         { display: flex !important; }
    .kb-content         { margin-left: 0 !important; padding-top: 56px; }
  }
  .kb-shell { overflow-x: hidden; max-width: 100vw; }
`}</style>
```

And add `className="kb-shell"` to the shell div (around line 114):
```tsx
// BEFORE
<div style={s.shell}>

// AFTER
<div className="kb-shell" style={s.shell}>
```

---

#### File 2: `app/screens/TournamentSearch.tsx`

**Goal:** fix grid minmax that overflows on 320px screens.

Find the `s` style object. Locate `grid` (line 48):
```js
// BEFORE
grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
```
Change to:
```js
// AFTER
grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 },
```

Also reduce page padding for mobile. The `page` style is at line 37:
```js
// BEFORE
page: { minHeight: '100vh', background: '#f5f5f5', padding: '32px 24px', fontFamily: 'Roboto, sans-serif', overflowY: 'auto' },
```
Change to:
```js
// AFTER
page: { minHeight: '100vh', background: '#f5f5f5', padding: '32px 24px', fontFamily: 'Roboto, sans-serif', overflowY: 'auto', boxSizing: 'border-box' as const, maxWidth: '100vw' },
```

Add a `<style>` tag for mobile inside the `return` statement. The current return is:
```tsx
return (
  <Sidebar>
    <div data-testid="tournament-search-screen" style={s.page}>
```
Change to:
```tsx
return (
  <Sidebar>
    <style>{`
      @media (max-width: 600px) {
        .kb-search-page { padding: 16px 12px !important; }
        .kb-search-grid { grid-template-columns: 1fr !important; }
      }
    `}</style>
    <div data-testid="tournament-search-screen" className="kb-search-page" style={s.page}>
```

Then add `className="kb-search-grid"` to the grid div (around line 90):
```tsx
// BEFORE
<div style={s.grid}>

// AFTER
<div className="kb-search-grid" style={s.grid}>
```

---

#### File 3: `app/screens/ProfileScreen.tsx`

**Goal:** make the two-column field grid collapse to single column on small screens.

Find the `row` style (line 73):
```js
// BEFORE (this is fine for larger screens)
row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 0 },
```

Add responsive CSS. Wrap the return JSX to include a `<style>` tag.

Current return starts at line 107:
```tsx
return (
  <Sidebar>
    <div data-testid="profile-screen" style={s.page}>
```
Change to:
```tsx
return (
  <Sidebar>
    <style>{`
      @media (max-width: 600px) {
        .kb-profile-row { grid-template-columns: 1fr !important; }
        .kb-profile-page { padding: 16px 12px !important; }
        .kb-profile-card { padding: 16px !important; }
      }
    `}</style>
    <div data-testid="profile-screen" className="kb-profile-page" style={s.page}>
```

Then add `className="kb-profile-row"` to every `<div style={s.row}>` in the JSX.
There are two of them — in the personal info card and the sports info card:
```tsx
// BEFORE (both instances)
<div style={s.row}>

// AFTER (both instances)
<div className="kb-profile-row" style={s.row}>
```

Also add `className="kb-profile-card"` to every `<div style={s.card}>` and `<div style={s.readonlyCard}>`:
```tsx
// BEFORE
<div style={s.card}>
// AFTER
<div className="kb-profile-card" style={s.card}>

// BEFORE
<div style={s.readonlyCard}>
// AFTER
<div className="kb-profile-card" style={s.readonlyCard}>
```

---

#### File 4: `app/screens/MainScreen.tsx`

**Goal:** fix quickGrid minmax so tiles render properly on 320px.

Find the `s` object, locate `quickGrid` (line 53):
```js
// BEFORE
quickGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 32 },
```
Change to:
```js
// AFTER
quickGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 32 },
```

Also add responsive CSS before the return. Current return starts at line 82:
```tsx
return (
  <Sidebar>
    <div data-testid="main-screen" style={s.page}>
```
Change to:
```tsx
return (
  <Sidebar>
    <style>{`
      @media (max-width: 600px) {
        .kb-main-page { padding: 16px 12px !important; }
        .kb-quick-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
      }
    `}</style>
    <div data-testid="main-screen" className="kb-main-page" style={s.page}>
```

Add `className="kb-quick-grid"` to the quickGrid div (around line 98):
```tsx
// BEFORE
<div style={s.quickGrid}>

// AFTER
<div className="kb-quick-grid" style={s.quickGrid}>
```

---

#### File 5: `app/screens/TournamentManagement.tsx`

**Goal:** button row in card header should wrap on small screens.

Find the `s` object. Locate `cardHeader` and `btnRow`:
```js
// BEFORE
cardHeader: { display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 },
btnRow:     { display: 'flex', gap: 8, flexShrink: 0 },
```
Change to:
```js
// AFTER
cardHeader: { display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14, flexWrap: 'wrap' as const },
btnRow:     { display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' as const },
```

Add responsive CSS before return. Current return starts at line ~95:
```tsx
return (
  <Sidebar>
    <div data-testid="tournament-management-screen" style={s.page}>
```
Change to:
```tsx
return (
  <Sidebar>
    <style>{`
      @media (max-width: 600px) {
        .kb-mgmt-page { padding: 16px 12px !important; }
        .kb-mgmt-card { padding: 14px !important; }
        .kb-mgmt-btnrow { flex-direction: column !important; }
        .kb-mgmt-btnrow button { width: 100% !important; }
      }
    `}</style>
    <div data-testid="tournament-management-screen" className="kb-mgmt-page" style={s.page}>
```

Add className to the card div and btnRow div:
```tsx
// Every card div:
<div key={reg.id ?? i} style={s.card}>
// Change to:
<div key={reg.id ?? i} className="kb-mgmt-card" style={s.card}>

// The btnRow div:
<div style={s.btnRow}>
// Change to:
<div className="kb-mgmt-btnrow" style={s.btnRow}>
```

---

#### File 6: `app/screens/TournamentHistory.tsx`

**Goal:** reduce padding on mobile, ensure modality chips wrap properly.

Add responsive CSS before return. Current return starts at line 75:
```tsx
return (
  <Sidebar>
    <div data-testid="tournament-history-screen" style={s.page}>
```
Change to:
```tsx
return (
  <Sidebar>
    <style>{`
      @media (max-width: 600px) {
        .kb-hist-page { padding: 16px 12px !important; }
        .kb-hist-card { padding: 14px !important; }
        .kb-hist-modal-card { min-width: 120px !important; }
      }
    `}</style>
    <div data-testid="tournament-history-screen" className="kb-hist-page" style={s.page}>
```

Add classNames in the JSX:
```tsx
// card divs (line ~97):
<div key={reg.id ?? i} style={s.card} data-testid={`history-item-${i}`}>
// Change to:
<div key={reg.id ?? i} className="kb-hist-card" style={s.card} data-testid={`history-item-${i}`}>

// modalCard divs (line ~123):
<div key={j} style={s.modalCard}>
// Change to:
<div key={j} className="kb-hist-modal-card" style={s.modalCard}>
```

---

#### File 7: `app/screens/FormScreen.tsx`

**Goal:** reduce padding on mobile so the wizard card doesn't overflow.

Find the `S` object. Locate `card` (line 23) and `page` (line 22):
```js
// BEFORE
page: { minHeight: '100vh', background: '#f5f5f5', padding: 16, ... },
card: { maxWidth: 720, margin: '0 auto', background: '#fff', borderRadius: 14, padding: 32, ... },
```

Add responsive CSS. The WebWizard component returns:
```tsx
return (
  <div style={S.page}>
    <div style={S.card}>
```
Change to:
```tsx
return (
  <>
    <style>{`
      @media (max-width: 600px) {
        .kb-form-card { padding: 16px !important; }
        .kb-form-grid2 { grid-template-columns: 1fr !important; }
        .kb-form-grid3 { grid-template-columns: 1fr 1fr !important; }
      }
    `}</style>
    <div style={S.page}>
      <div className="kb-form-card" style={S.card}>
```
(Also close the extra `<>` at the end of the return — add `</>` after the closing `</div></div>`)

Add classNames to the grid divs:
```tsx
// grid2 (around line 281):
<div style={S.grid2} data-testid="modality-grid">
// Change to:
<div className="kb-form-grid2" style={S.grid2} data-testid="modality-grid">

// grid3 (around line 319):
<div style={S.grid3} data-testid="weight-grid">
// Change to:
<div className="kb-form-grid3" style={S.grid3} data-testid="weight-grid">
```

---

### 1.3 Verify — Playwright test to add

Create a new file: `e2e/responsive.spec.ts`

```typescript
import { test, expect, Page } from '@playwright/test';

// Inject a minimal auth session into localStorage
async function injectAuth(page: Page) {
  await page.addInitScript(() => {
    const user = {
      id: 'resp-user', email: 'resp@test.com', passwordHash: 'abc',
      role: 'athlete', fullName: 'Resp Tester', country: 'CR',
      age: '25', gender: 'Masculino', academy: 'Dojo Test',
      weight: '70', beltGrade: 'Azul',
      createdAt: '2026-01-01T00:00:00.000Z', synced: false,
    };
    localStorage.setItem('db:users',           JSON.stringify([user]));
    localStorage.setItem('db:session_user_id', user.id);
    localStorage.setItem('db:registrations',   JSON.stringify([]));
  });
}

// Viewports to test
const VIEWPORTS = [
  { name: 'Small Mobile 320',  width: 320,  height: 568  },
  { name: 'Small Mobile 360',  width: 360,  height: 640  },
  { name: 'Medium Mobile 375', width: 375,  height: 812  },
  { name: 'Medium Mobile 390', width: 390,  height: 844  },
  { name: 'Tablet Landscape',  width: 1024, height: 768  },
  { name: 'Tablet Wide',       width: 1280, height: 800  },
];

// Helper: check that there is no horizontal scrollbar
async function hasNoHorizontalScroll(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
}

// Helper: check that all key elements are visible (in viewport)
async function allVisible(page: Page, selectors: string[]): Promise<void> {
  for (const sel of selectors) {
    await expect(page.locator(sel).first()).toBeVisible({ timeout: 5000 });
  }
}

for (const vp of VIEWPORTS) {
  test.describe(`Responsive — ${vp.name} (${vp.width}×${vp.height})`, () => {

    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
    });

    test('MainScreen — no horizontal scroll, all tiles visible', async ({ page }) => {
      await injectAuth(page);
      await page.goto('/screens/MainScreen');
      await page.waitForSelector('[data-testid="main-screen"]', { timeout: 20000 });

      expect(await hasNoHorizontalScroll(page)).toBe(true);
      await allVisible(page, [
        '[data-testid="nav-search"]',
        '[data-testid="nav-history"]',
        '[data-testid="nav-profile"]',
        '[data-testid="nav-management"]',
      ]);
    });

    test('TournamentSearch — no horizontal scroll, search bar visible', async ({ page }) => {
      await injectAuth(page);
      await page.goto('/screens/TournamentSearch');
      await page.waitForSelector('[data-testid="tournament-search-screen"]', { timeout: 20000 });

      expect(await hasNoHorizontalScroll(page)).toBe(true);
      await allVisible(page, [
        '[data-testid="search-input"]',
        '[data-testid="tournament-tile-1"]',
        '[data-testid="tournament-tile-3"]',
      ]);
    });

    test('ProfileScreen — no horizontal scroll, edit button visible', async ({ page }) => {
      await injectAuth(page);
      await page.goto('/screens/ProfileScreen');
      await page.waitForSelector('[data-testid="profile-screen"]', { timeout: 20000 });

      expect(await hasNoHorizontalScroll(page)).toBe(true);
      await allVisible(page, [
        '[data-testid="btn-edit-profile"]',
      ]);
    });

    test('TournamentManagement — no horizontal scroll', async ({ page }) => {
      await injectAuth(page);
      await page.goto('/screens/TournamentManagement');
      await page.waitForSelector('[data-testid="tournament-management-screen"]', { timeout: 20000 });

      expect(await hasNoHorizontalScroll(page)).toBe(true);
    });

    test('TournamentHistory — no horizontal scroll', async ({ page }) => {
      await injectAuth(page);
      await page.goto('/screens/TournamentHistory');
      await page.waitForSelector('[data-testid="tournament-history-screen"]', { timeout: 20000 });

      expect(await hasNoHorizontalScroll(page)).toBe(true);
    });

    test('FormScreen — no horizontal scroll, info step visible', async ({ page }) => {
      await injectAuth(page);
      await page.goto('/screens/FormScreen?tournamentId=3&tournamentName=Kyokushin');
      await page.waitForSelector('#academy-input', { timeout: 20000 });

      expect(await hasNoHorizontalScroll(page)).toBe(true);
      await allVisible(page, ['#academy-input', '#grade-input']);
    });

    test('HomeScreen — no horizontal scroll', async ({ page }) => {
      await page.goto('/screens/HomeScreen');
      await page.waitForSelector('[data-testid="home-screen"]', { timeout: 20000 });

      expect(await hasNoHorizontalScroll(page)).toBe(true);
      await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible();
    });

  });
}
```

### 1.4 Debug guide

**Problem:** Test fails with `scrollWidth > innerWidth`.
**Diagnosis steps:**
1. Open the failing URL in a real browser. Open DevTools → set device to the failing viewport.
2. Open DevTools → Elements panel → hover over `<body>` → it will show its rendered width.
3. Add `outline: 1px solid red` to every child of the shell in DevTools to find which one overflows.
4. Common culprits: an element with `min-width` larger than viewport, or a grid with a `minmax(Npx, 1fr)` where N > available width.

**Problem:** Element not visible but is in the DOM.
**Diagnosis:** The element may be behind the fixed top bar on mobile (56px). Check that the page has `padding-top` sufficient for content to clear the top bar. In Sidebar, `kb-content` gets `padding-top: 56px` on mobile which should handle this.

**Problem:** CSS classes not applying.
**Reason:** React Native web sometimes strips `<style>` tags. If a screen's `<style>` tag doesn't work, inject it via `document.head.appendChild` in a `useEffect` inside the component as a fallback.

---

## Step 2 — Vertical Scroll on All Screens

### 2.1 Context — what is broken and why

The issue: on mobile viewports (320px–390px), content on several screens is taller than the screen but the user cannot scroll to see it.

**Root cause:** The `overflowY: 'auto'` style on the `page` div only creates an internal scrollbar if the div has a **bounded height** (a fixed `height` or `max-height`). Without a fixed height, the div simply grows to fit its content — there is no overflow, and therefore no scrollbar appears inside the div. The document (body) would normally scroll, but Expo Router on web sets `overflow: hidden` on `html` and `body` to manage navigation transitions — this blocks the body scroll.

**Solution:** Change each screen's root `page` div from `minHeight: '100vh'` to `height: '100vh'` combined with `overflowY: 'auto'`. This creates a proper bounded scroll container. The Sidebar's `kb-content` div must also not restrict height.

Additionally, update `components/Sidebar.tsx` to allow the content area to expand.

### 2.2 Changes — exact modifications

#### File 1: `components/Sidebar.tsx`

Find the `content` style object (line ~100):
```js
// BEFORE
content: { marginLeft: 240, flex: 1, minWidth: 0 },
```
Change to:
```js
// AFTER
content: { marginLeft: 240, flex: 1, minWidth: 0, height: '100vh', overflowY: 'auto' },
```

The existing responsive CSS in the `<style>` tag must also update `kb-content` for mobile. Find the `<style>` tag (around line 107) and add the height rule:
```css
/* BEFORE */
@media (max-width: 767px) {
  .kb-desktop-sidebar { display: none !important; }
  .kb-top-bar         { display: flex !important; }
  .kb-content         { margin-left: 0 !important; padding-top: 56px; }
}

/* AFTER */
@media (max-width: 767px) {
  .kb-desktop-sidebar { display: none !important; }
  .kb-top-bar         { display: flex !important; }
  .kb-content         { margin-left: 0 !important; padding-top: 56px; height: calc(100vh - 0px); overflow-y: auto; }
}
```

#### Files 2–5: Screen-level page div height fix

For each of the four screens listed in the todo, change `minHeight: '100vh'` to just set box sizing properly. Since we moved scrolling to the Sidebar `kb-content` wrapper, the screen's `page` div should use `minHeight` (so it fills at least full height) and NOT have `overflowY` (since the parent handles scroll).

Actually — the cleanest pattern: the Sidebar's `kb-content` is the scroll container (`height: 100vh, overflowY: auto`). The screen's `page` div inside it should use `minHeight: '100%'` or just `minHeight: 0` and let content flow naturally.

Make these changes:

**`app/screens/TournamentHistory.tsx` — line 31:**
```js
// BEFORE
page: { minHeight: '100vh', background: '#f5f5f5', padding: '32px 24px', fontFamily: 'Roboto, sans-serif', overflowY: 'auto' },
// AFTER
page: { minHeight: '100%', background: '#f5f5f5', padding: '32px 24px', fontFamily: 'Roboto, sans-serif' },
```

**`app/screens/ProfileScreen.tsx` — line 65:**
```js
// BEFORE
page: { minHeight: '100vh', background: '#f5f5f5', padding: '32px 24px', fontFamily: 'Roboto, sans-serif', overflowY: 'auto' },
// AFTER
page: { minHeight: '100%', background: '#f5f5f5', padding: '32px 24px', fontFamily: 'Roboto, sans-serif' },
```

**`app/screens/TournamentSearch.tsx` — line 37:**
```js
// BEFORE
page: { minHeight: '100vh', background: '#f5f5f5', padding: '32px 24px', fontFamily: 'Roboto, sans-serif', overflowY: 'auto' },
// AFTER
page: { minHeight: '100%', background: '#f5f5f5', padding: '32px 24px', fontFamily: 'Roboto, sans-serif' },
```

**`app/screens/MainScreen.tsx` — line 40:**
```js
// BEFORE
page: { minHeight: '100vh', background: '#f0f2f5', padding: '28px 24px', fontFamily: 'Roboto, sans-serif', overflowY: 'auto' },
// AFTER
page: { minHeight: '100%', background: '#f0f2f5', padding: '28px 24px', fontFamily: 'Roboto, sans-serif' },
```

Also do the same for the other screens that use Sidebar:
- `TournamentManagement.tsx` — line 172
- `CoachAthletesScreen.tsx` — find its page style

### 2.3 Verify — Playwright test to add

Add this `describe` block to `e2e/responsive.spec.ts` (append it below the existing tests in that file):

```typescript
// ── Scroll tests ──────────────────────────────────────────────────────────────
// These use a narrow viewport to force content to be taller than the screen.
// We inject extra registrations to ensure TournamentHistory and Management
// have enough content to overflow.

async function injectAuthWithManyRegistrations(page: Page) {
  await page.addInitScript(() => {
    const user = {
      id: 'scroll-user', email: 'scroll@test.com', passwordHash: 'abc',
      role: 'athlete', fullName: 'Scroll Tester', country: 'CR',
      age: '25', gender: 'Masculino', academy: 'Dojo Scroll',
      weight: '70', beltGrade: 'Azul',
      createdAt: '2026-01-01T00:00:00.000Z', synced: false,
    };
    // 6 registrations — enough to overflow a 568px screen
    const regs = Array.from({ length: 6 }, (_, i) => ({
      id: `reg-${i}`,
      userId: 'scroll-user',
      tournamentId: String((i % 4) + 1),
      tournamentName: `Torneo de Prueba ${i + 1}`,
      athleteName: 'Scroll Tester',
      modalities: [{ discipline: 'Kumite', weightDivision: '60–70 kg', gender: 'Masculino', ageGroup: 'Adulto' }],
      timestamp: new Date(2025, i, 1).toISOString(), // all past dates (2025)
      synced: false,
    }));
    localStorage.setItem('db:users',           JSON.stringify([user]));
    localStorage.setItem('db:session_user_id', user.id);
    localStorage.setItem('db:registrations',   JSON.stringify(regs));
  });
}

test.describe('Scroll — all required screens can scroll to bottom', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
  });

  // Helper: scroll the kb-content div to its bottom and verify it moved
  async function canScrollToBottom(page: Page, screenTestId: string): Promise<void> {
    await page.waitForSelector(`[data-testid="${screenTestId}"]`, { timeout: 20000 });

    // Measure initial scroll position of the content container
    const initialScroll = await page.evaluate(() => {
      const el = document.querySelector('.kb-content') as HTMLElement | null;
      return el ? el.scrollTop : window.scrollY;
    });

    // Scroll to bottom
    await page.evaluate(() => {
      const el = document.querySelector('.kb-content') as HTMLElement | null;
      if (el) { el.scrollTo(0, el.scrollHeight); }
      else { window.scrollTo(0, document.body.scrollHeight); }
    });

    await page.waitForTimeout(300);

    // Verify scroll position changed (content was taller than viewport)
    const finalScroll = await page.evaluate(() => {
      const el = document.querySelector('.kb-content') as HTMLElement | null;
      return el ? el.scrollTop : window.scrollY;
    });

    // scrollHeight > clientHeight means scrolling was possible
    const scrollable = await page.evaluate(() => {
      const el = document.querySelector('.kb-content') as HTMLElement | null;
      if (el) return el.scrollHeight > el.clientHeight;
      return document.body.scrollHeight > window.innerHeight;
    });

    expect(scrollable).toBe(true);
  }

  test('TournamentHistory — vertical scroll enabled', async ({ page }) => {
    await injectAuthWithManyRegistrations(page);
    await page.goto('/screens/TournamentHistory');
    await canScrollToBottom(page, 'tournament-history-screen');
  });

  test('ProfileScreen — vertical scroll enabled', async ({ page }) => {
    await injectAuthWithManyRegistrations(page);
    await page.goto('/screens/ProfileScreen');
    await canScrollToBottom(page, 'profile-screen');
  });

  test('TournamentSearch — vertical scroll enabled', async ({ page }) => {
    await injectAuthWithManyRegistrations(page);
    await page.goto('/screens/TournamentSearch');
    await canScrollToBottom(page, 'tournament-search-screen');
  });

  test('MainScreen — vertical scroll enabled', async ({ page }) => {
    await injectAuthWithManyRegistrations(page);
    await page.goto('/screens/MainScreen');
    await canScrollToBottom(page, 'main-screen');
  });
});
```

**How the test works:**
- Sets viewport to 360×640 (small mobile)
- Injects 6 registrations — enough to make the list taller than 640px
- Scrolls the `.kb-content` div (the Sidebar scroll container) to its bottom
- Asserts `scrollHeight > clientHeight` to confirm scroll was possible

### 2.4 Debug guide

**Problem:** `scrollHeight === clientHeight` — element is not scrollable.
**Check 1:** Open DevTools → select the `.kb-content` div → check Computed styles → look for `overflow-y`. It must be `auto` or `scroll`.
**Check 2:** The div must have a fixed `height`. If `height` shows `auto`, the scroll container is not bounded. Recheck that `height: '100vh'` was applied.
**Check 3:** Confirm the `minHeight: '100%'` was applied to the child page div (not `100vh`). If the child has `height: 100vh`, it fills the parent exactly and leaves no room to scroll.

**Problem:** Page goes blank after the change.
**Reason:** If `height: '100vh'` is applied but the parent flex container has issues, the content area might collapse. Verify the Sidebar `shell` still has `display: 'flex'` and `minHeight: '100vh'`. The `content` div is `flex: 1` which requires the flex parent to have a height.

**Alternative approach if above does not work:**
If the Sidebar scroll approach creates too many issues, apply scroll to `body` instead. Add this to `app/_layout.tsx` (inside the RootLayout component body, before the return):
```tsx
useEffect(() => {
  if (typeof document !== 'undefined') {
    document.documentElement.style.overflowY = 'auto';
    document.body.style.overflowY = 'auto';
    document.body.style.height = 'auto';
  }
}, []);
```
And revert the Sidebar `content` change back to the original. Then each screen's page div keeps `minHeight: '100vh', overflowY: 'auto'` — the body itself will scroll.

---

## Step 3 — Tournament History: Show Only Completed Tournaments

### 3.1 Context — what is broken and why

**File:** `app/screens/TournamentHistory.tsx`

**Current behavior (line 21–26):**
```typescript
DB.getRegistrationsByUserId(currentUser.id).then(data => {
  // History = all registrations (past + present), sorted newest first
  setRegistrations([...data].sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
  setLoadingData(false);
});
```
This fetches ALL registrations and displays them regardless of whether the tournament has happened yet.

**Required behavior:** Only show tournaments whose date is in the past (i.e., the event has already occurred = "completed"). Active/upcoming registrations should appear only in TournamentManagement, not here.

**Note on "cancelled":** The cancel flow (implemented in TournamentManagement.tsx) deletes the registration from the database entirely — cancelled registrations have no record and will never appear anywhere. So the only "historical" records are past-dated tournaments.

**Note on unknown tournament IDs:** If `getTournamentById(tournamentId)` returns `undefined` (e.g., a tournament was removed from the catalog), it should NOT appear in history since we cannot determine if it is in the past. Exclude it.

**Complementary change in TournamentManagement.tsx:** The active tournament screen currently shows all registrations, but ideally it should also filter to only future tournaments. This is documented in the code but not yet enforced. Make this change too for consistency.

### 3.2 Changes — exact modifications

#### File 1: `app/screens/TournamentHistory.tsx`

Replace lines 19–26 (the useEffect that loads data):

```typescript
// BEFORE
useEffect(() => {
  if (!currentUser) return;
  DB.getRegistrationsByUserId(currentUser.id).then(data => {
    // History = all registrations (past + present), sorted newest first
    setRegistrations([...data].sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
    setLoadingData(false);
  });
}, [currentUser]);
```

```typescript
// AFTER
useEffect(() => {
  if (!currentUser) return;
  DB.getRegistrationsByUserId(currentUser.id).then(data => {
    const today = new Date(new Date().toDateString()); // midnight today (no time component)
    const completed = data.filter(r => {
      const tournament = getTournamentById(r.tournamentId);
      if (!tournament) return false;              // unknown tournament — exclude
      return new Date(tournament.date) < today;   // only past tournaments
    });
    setRegistrations([...completed].sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
    setLoadingData(false);
  });
}, [currentUser]);
```

**Also update the empty state message** (around line 87) to reflect that history is specifically past tournaments:
```tsx
// BEFORE
<div style={s.emptyTxt}>No tienes torneos registrados aún</div>

// AFTER
<div style={s.emptyTxt}>No tienes torneos completados aún</div>
```

And update the subtitle (around line 80):
```tsx
// BEFORE
<div style={s.pageSub}>Todos tus torneos registrados</div>

// AFTER
<div style={s.pageSub}>Torneos en los que ya has participado</div>
```

#### File 2: `app/screens/TournamentManagement.tsx`

The active screen should only show FUTURE registrations. Find the `loadData` function (around line 57):

```typescript
// BEFORE
const loadData = () => {
  if (!currentUser) return;
  DB.getRegistrationsByUserId(currentUser.id).then(data => {
    setRegistrations(data);
    setLoadingData(false);
  });
};
```

```typescript
// AFTER
const loadData = () => {
  if (!currentUser) return;
  DB.getRegistrationsByUserId(currentUser.id).then(data => {
    const today = new Date(new Date().toDateString());
    const active = data.filter(r => {
      const tournament = getTournamentById(r.tournamentId);
      if (!tournament) return true;             // unknown tournament — keep active
      return new Date(tournament.date) >= today; // only future/today tournaments
    });
    setRegistrations(active);
    setLoadingData(false);
  });
};
```

Note: `getTournamentById` is already imported at the top of `TournamentManagement.tsx` (line 6) — no new import needed.

### 3.3 Verify — Playwright test to add

Create a new file: `e2e/tournament-history-filter.spec.ts`

```typescript
import { test, expect, Page } from '@playwright/test';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function injectWithMixedRegistrations(page: Page) {
  await page.addInitScript(() => {
    const user = {
      id: 'hist-user', email: 'hist@test.com', passwordHash: 'abc',
      role: 'athlete', fullName: 'Hist Tester', country: 'CR',
      age: '25', gender: 'Masculino', academy: 'Dojo Hist',
      weight: '70', beltGrade: 'Azul',
      createdAt: '2025-01-01T00:00:00.000Z', synced: false,
    };

    // Tournament IDs in this app:
    //   '1' → Copa Nacional Kumite 2026      → date 2026-05-15 (FUTURE from 2026-04-05)
    //   '2' → Panamerican Open Judo          → date 2026-06-20 (FUTURE)
    //   '3' → Copa Centroamericana Kyokushin → date 2026-07-12 (FUTURE)
    //   '4' → Central America Gi Open        → date 2026-08-05 (FUTURE)
    //
    // To simulate a PAST tournament, we override Date so the browser thinks
    // it's 2027-01-01. All four tournaments become "in the past".
    // We will do this per-test where needed.

    const regs = [
      {
        id: 'reg-future', userId: 'hist-user', tournamentId: '1',
        tournamentName: 'Copa Nacional Kumite 2026',
        athleteName: 'Hist Tester',
        modalities: [],
        timestamp: '2026-03-01T10:00:00.000Z',
        synced: false,
      },
      {
        id: 'reg-past', userId: 'hist-user', tournamentId: '2',
        tournamentName: 'Panamerican Open Judo',
        athleteName: 'Hist Tester',
        modalities: [],
        timestamp: '2026-01-01T10:00:00.000Z',
        synced: false,
      },
    ];
    localStorage.setItem('db:users',           JSON.stringify([user]));
    localStorage.setItem('db:session_user_id', user.id);
    localStorage.setItem('db:registrations',   JSON.stringify(regs));
  });
}

async function injectWithFutureOnly(page: Page) {
  await page.addInitScript(() => {
    const user = {
      id: 'hist-user2', email: 'hist2@test.com', passwordHash: 'abc',
      role: 'athlete', fullName: 'Future Tester', country: 'CR',
      age: '25', gender: 'Masculino', academy: 'Dojo',
      weight: '70', beltGrade: 'Azul',
      createdAt: '2026-01-01T00:00:00.000Z', synced: false,
    };
    const regs = [
      {
        id: 'reg-1', userId: 'hist-user2', tournamentId: '3',
        tournamentName: 'Copa Centroamericana Kyokushin 2026',
        athleteName: 'Future Tester',
        modalities: [],
        timestamp: '2026-04-01T10:00:00.000Z',
        synced: false,
      },
    ];
    localStorage.setItem('db:users',           JSON.stringify([user]));
    localStorage.setItem('db:session_user_id', user.id);
    localStorage.setItem('db:registrations',   JSON.stringify(regs));
  });
}

// Override Date so the browser thinks it is 2027-01-01 — all 2026 tournaments become past
async function fastForwardDateTo2027(page: Page) {
  await page.addInitScript(() => {
    const RealDate = Date;
    const FAKE_NOW = new RealDate('2027-01-01T12:00:00.000Z').getTime();

    class FakeDate extends RealDate {
      constructor(...args: any[]) {
        if (args.length === 0) super(FAKE_NOW);
        else super(...(args as [any]));
      }
      static now() { return FAKE_NOW; }
    }
    (window as any).Date = FakeDate;
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('TournamentHistory — filter logic', () => {

  test('shows empty state when all registrations are for future tournaments', async ({ page }) => {
    // No date override — current date is 2026-04-05, all tournaments are in 2026 (future)
    await injectWithFutureOnly(page);
    await page.goto('/screens/TournamentHistory');
    await page.waitForSelector('[data-testid="tournament-history-screen"]', { timeout: 20000 });
    await page.waitForTimeout(500);

    // No completed tournaments → empty state
    await expect(page.getByText(/No tienes torneos completados/)).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="history-list"]')).not.toBeVisible();
  });

  test('shows only past tournaments when date is in 2027', async ({ page }) => {
    // Override date BEFORE injecting auth (addInitScript order matters)
    await fastForwardDateTo2027(page);
    await injectWithMixedRegistrations(page);

    await page.goto('/screens/TournamentHistory');
    await page.waitForSelector('[data-testid="tournament-history-screen"]', { timeout: 20000 });
    await page.waitForTimeout(500);

    // Both registrations are for 2026 tournaments, and we are "in 2027" → both are past
    await expect(page.locator('[data-testid="history-list"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="history-item-0"]')).toBeVisible();

    // Both tournament names should appear
    await expect(page.getByText('Copa Nacional Kumite 2026').first()).toBeVisible();
    await expect(page.getByText('Panamerican Open Judo').first()).toBeVisible();
  });

  test('active tournaments (TournamentManagement) do NOT show past registrations', async ({ page }) => {
    await injectWithMixedRegistrations(page);

    // With real date (2026-04-05), both tournament dates are in future → both shown as active
    await page.goto('/screens/TournamentManagement');
    await page.waitForSelector('[data-testid="tournament-management-screen"]', { timeout: 20000 });
    await page.waitForTimeout(500);

    await expect(page.locator('[data-testid="registration-list"]')).toBeVisible({ timeout: 8000 });

    // Copa Nacional (2026-05-15) and Panamerican (2026-06-20) are both future → both visible
    await expect(page.getByText('Copa Nacional Kumite 2026').first()).toBeVisible();
    await expect(page.getByText('Panamerican Open Judo').first()).toBeVisible();
  });

  test('active tournaments screen is empty when all tournaments are in the past', async ({ page }) => {
    await fastForwardDateTo2027(page);
    await injectWithMixedRegistrations(page);

    await page.goto('/screens/TournamentManagement');
    await page.waitForSelector('[data-testid="tournament-management-screen"]', { timeout: 20000 });
    await page.waitForTimeout(500);

    // In 2027 all 2026 tournaments are past → no active registrations
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="registration-list"]')).not.toBeVisible();
  });
});
```

### 3.4 Debug guide

**Problem:** History still shows future tournaments.
**Check:** Verify `new Date(new Date().toDateString())` is being used (strips time component). Using `new Date()` directly would include the current time. A tournament with `date: '2026-07-12'` parsed as `new Date('2026-07-12')` is midnight UTC, which could be "in the past" relative to UTC+N timezones. Using `new Date().toDateString()` normalizes both sides to midnight local time.

**Problem:** The date override test `fastForwardDateTo2027` doesn't work.
**Reason:** If `injectWithMixedRegistrations` is called before `fastForwardDateTo2027`, the Date is overridden AFTER localStorage is set, but the order only matters for what runs first in the browser. Both `addInitScript` calls run before page load. **Critical:** `page.addInitScript` callbacks run in the order they are registered. `fastForwardDateTo2027` MUST be called before `injectWithMixedRegistrations` in the test — verify this order in the test file.

**Problem:** Both tests pass locally but one fails in CI.
**Reason:** Timezone differences. A tournament with date `2026-05-15` is midnight UTC. In UTC+5 it's already May 14 at 7pm. In UTC-5 it's still May 15 at 7pm. Use `new Date(new Date().toDateString())` consistently (which normalizes to local midnight) to avoid timezone bugs.

---

## Running everything

```bash
# Start the dev server (keep this running in a separate terminal)
npm run web

# Run only the new tests
npx playwright test e2e/responsive.spec.ts
npx playwright test e2e/tournament-history-filter.spec.ts

# Run all tests
npm run test:e2e

# Open visual test UI (useful for debugging)
npm run test:e2e:ui

# See HTML report after run
npm run test:e2e:report
```

## Order of implementation

Do the steps in this order to minimize breakage:
1. **Step 3 first** — pure logic change, no CSS, easiest to verify
2. **Step 2 second** — Sidebar scroll container change, then screen page div changes
3. **Step 1 last** — CSS responsive rules, one screen at a time, test each viewport

Run `npm run test:e2e` after each step to confirm existing tests still pass before moving on.

## Final verification checklist

After all three steps are complete, ALL of the following must be true:

- [ ] `npx playwright test e2e/responsive.spec.ts` — all pass
- [ ] `npx playwright test e2e/tournament-history-filter.spec.ts` — all pass
- [ ] `npx playwright test` (full suite) — no regressions in existing tests
- [ ] Manual check: open app at 360px width in DevTools — no horizontal scrollbar on any screen
- [ ] Manual check: on ProfileScreen, the two-column field grid collapses to one column below 600px
- [ ] Manual check: TournamentHistory shows no tournaments when all registrations are for future dates
- [ ] Manual check: TournamentManagement shows tournaments that TournamentHistory does not (future ones)
