# Edit Registration Wizard — Pre-population and Confirmation Review

**Status:** Implemented
**Affects:** `db/database.web.ts`, `db/database.native.ts`, `app/screens/FormScreen.tsx`

---

## Problem

When a user edits an active tournament registration, the wizard opens
at the "Manage Modalities" step, skipping the Info step entirely. This
means:

1. The academy and belt grade fields are never shown — the user cannot
   confirm or change the values used for that registration.
2. Changes are committed immediately when the user clicks "Save
   Changes" with no confirmation step.

### Expected behavior (example)

User originally registered with:
- Academy: CobraKai
- Grade: 10° Kyu
- Modality: Kumite — less than 40 kg

When they open the edit wizard they should see:
1. **Info step** — Academy field pre-filled with "CobraKai", Grade
   pre-selected as "10° Kyu". They can change these or proceed.
2. **Modality step** — Their existing Kumite / <40 kg modality already
   shown. They can add another or remove this one.
3. **Review step (new)** — A confirmation screen listing all modalities
   they are about to save, with per-modality remove buttons (at least
   one modality must remain). A final "Confirm & Save" button commits
   the changes.

---

## Root Causes

| # | Cause | Fix |
|---|-------|-----|
| 1 | Edit mode initialization sets `phase = 'another'`, skipping `'info'` | Change to `phase = 'info'` |
| 2 | `Registration` type has no `academy` or `grade` fields, so restoration is impossible | Add optional `academy?: string` and `grade?: string` to the type |
| 3 | `submitInfo()` always routes to `'modality'` regardless of mode | In edit mode, route to `'another'` so existing modalities are shown first |
| 4 | `finishNow()` calls `saveAndFinish()` directly | In edit mode, route to new `'review'` phase instead |
| 5 | No `'review'` phase exists | Add it |

---

## Detailed Changes

### 1. Extend `Registration` type — `db/database.web.ts` & `db/database.native.ts`

Add two optional fields that capture the values the athlete entered at
registration time (backward-compatible — old records simply won't have
them and will fall back to the user's current profile values):

```typescript
export interface Registration {
  // ...existing fields...
  academy?: string;   // captured at registration / edit time
  grade?:   string;   // captured at registration / edit time
}
```

### 2. Save `academy` and `grade` when registering or updating — `FormScreen.tsx`

In `saveAndFinish()`, include the wizard's current `academy` and
`grade` state in the payload so they are persisted for future edits:

```typescript
// addRegistration call
DB.addRegistration({ ..., academy, grade, ... });

// updateRegistration call
DB.updateRegistration(registrationId, { modalities, academy, grade });
```

### 3. Fix edit-mode initialization — `FormScreen.tsx`

**Before:** sessionStorage path and DB path both call `setPhase('another')`.

**After:** Always load the full registration from DB first (to retrieve
stored `academy`/`grade`), then check sessionStorage for staged
modalities. Start at `'info'` so the pre-populated fields are visible.

```typescript
useEffect(() => {
  if (!registrationId) return;

  DB.getRegistrationsByUserId(currentUser.id).then(regs => {
    const reg = regs.find(r => r.id === registrationId);

    // Restore academy + grade from the registration if stored
    if (reg?.academy) setAcademy(reg.academy);
    if (reg?.grade)   setGrade(reg.grade);

    // Prefer sessionStorage staged modalities (from EditModalitiesModal)
    const storageKey = `staged_modalities_${registrationId}`;
    const staged = sessionStorage.getItem(storageKey);
    if (staged) {
      sessionStorage.removeItem(storageKey);
      try {
        setChosenModalities(JSON.parse(staged));
        setPhase('info');   // ← was 'another'
        setInitialized(true);
        return;
      } catch {}
    }

    if (reg) setChosenModalities(reg.modalities ?? []);
    setPhase('info');       // ← was 'another'
    setInitialized(true);
  });
}, [registrationId]);
```

### 4. Fix `submitInfo()` routing — `FormScreen.tsx`

After completing the Info step:

- **New registration:** go to `'modality'` (unchanged).
- **Edit mode:** go to `'another'` so existing modalities are shown
  before the user picks new ones.

```typescript
const submitInfo = () => {
  // validation...
  if (!hasCategories) {
    saveAndFinish([]);
  } else if (isEditMode) {
    setPhase('another');   // show existing modalities first
  } else {
    setPhase('modality');  // pick first modality for new registration
  }
};
```

### 5. Add `'review'` phase — `FormScreen.tsx`

#### 5a. Type

```typescript
type Phase = 'info' | 'modality' | 'weight' | 'another' | 'review' | 'success';
```

#### 5b. `finishNow()` routes to `'review'` in edit mode

```typescript
const finishNow = () => {
  if (isEditMode) {
    setPhase('review');       // go to confirmation screen
  } else {
    saveAndFinish(chosenModalities);
  }
};
```

Non-edit mode: unchanged (saves directly, or auto-saves when all
modalities are exhausted).

#### 5c. Review phase render

Displayed between `'another'` and `'success'` in edit mode only.

**Layout:**
- Title: "✅ Confirmar Cambios"
- Subtitle: tournament name
- Info summary row: academy · grade
- Modality list:
  - Each modality shown as a card (discipline, weight division, gender, category)
  - Remove (✕) button per card — **disabled / grayed out when only 1 modality remains**
- Error message if 0 modalities (should not happen normally, but defensive)
- "← Volver a Modalidades" button → `setPhase('another')`
- "✓ Confirmar y Guardar" button → `saveAndFinish(chosenModalities)` (disabled if 0 modalities)

#### 5d. `'review'` phase label in Breadcrumbs

The Breadcrumbs component is hidden in edit mode (`!isEditMode`), so no
change is needed there. The `Phase` type expansion requires adding a
label entry to `labels` to avoid a TypeScript error:

```typescript
const labels: Record<Phase, string> = {
  // ...existing...
  review: 'Confirmación',
};
```

---

## Phase Flow Diagrams

### New registration (unchanged)

```
info → modality → weight (if needed) → another → (loop or finish) → success
                                                 ↑ auto-saves when all exhausted
```

### Edit registration (new)

```
info (pre-filled) → another (existing modalities) → review (confirm) → success
                       ↑ ← add another → modality → weight ──┘
```

---

## Success Criteria

- [ ] Opening edit wizard shows the Info step with academy and grade pre-filled
- [ ] After Info, the Modalities step shows all existing registered modalities
- [ ] The user can add new modalities or remove existing ones from the Modalities step
- [ ] Clicking "Save Changes" opens the Review confirmation step
- [ ] The Review step lists all modalities with individual remove buttons
- [ ] Remove button is disabled when only 1 modality remains
- [ ] "Confirm & Save" commits the changes and shows the success screen
- [ ] "Back to Modalities" returns to the Modalities step without losing changes
- [ ] Academy and grade entered in the wizard are saved with the registration
  and restored when editing again
