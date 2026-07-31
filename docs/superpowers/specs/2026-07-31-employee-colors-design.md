# Per-employee colors

**Date:** 2026-07-31
**Status:** Approved design, ready for implementation plan

## Problem

Shift cards on the schedule grid are colored by **role**, not by person
(`roleColors` in `src/features/scheduler/components/shift-card.tsx:11`). Three
cashiers render as three identical blue cards, so users cannot tell who is
working which shift at a glance. Reported as "visually unclear".

The complaint is measurable. Running the four current card backgrounds
(`purple-100`, `amber-100`, `blue-100`, `emerald-100`) through the dataviz
palette validator against the light card surface (`#ffffff`), all-pairs:

| Check | Result |
|---|---|
| Lightness band | FAIL — all four at L 0.93–0.96, outside 0.43–0.77 |
| Chroma floor | FAIL — 0.032–0.058 against a 0.10 floor; they read as gray |
| CVD separation | FAIL — worst pair ΔE **0.4** (protanopia) |
| Normal-vision floor | FAIL — worst pair ΔE **3.2**, against a floor of 15 |
| Contrast vs surface | 1.11–1.22:1 |

`blue-100` and `purple-100` are ΔE 3.2 apart. The pale tints are the root
cause, so **re-keying the same pale tints to employees instead of roles would
not fix anything** — 12 pale tints measure worse (ΔE 1.5) than the 4 that
already fail.

## Decisions

| Decision | Choice |
|---|---|
| Color model | Per-employee, stored on the `employees` row |
| Picker | Curated fixed palette, 12 slots (no free hex) |
| Placement | Add/Edit Employee dialog |
| Card treatment | Tinted background (kept) **plus** a saturated accent stripe + dot |
| Palette size | 12 |
| Existing employees | Backfilled by the migration |
| Permission | `requireRole('manager')` — the existing `updateEmployee` gate |

### Palette size: the accepted tradeoff

12 slots was chosen deliberately over the measured recommendation of 6, so
that every employee can hold a unique color. The cost is recorded here:

| Palette size | tint alone | tint + saturated accent |
|---|---|---|
| 6 | 5.8 | **11.5** |
| 8 | 3.1 | 6.9 |
| 12 | 1.5 | **3.8** |

(worst all-pairs normal-vision ΔE, worse of light/dark. ~10+ is comfortable,
under 5 reads as the same color.)

At 12 slots the weakest pairs — rose/red, pink/fuchsia, teal/emerald/green —
are not reliably distinguishable. Color is therefore an **accelerator, not an
identifier**. Three mitigations are load-bearing and must not be dropped:

1. **The employee's name stays on every shift card.** This is the secondary
   encoding that makes a sub-floor palette legitimate. Never render a shift
   card as color-only.
2. **Slots are assigned in fixed order, best-separated first** (below), so an
   org with ≤6 employees gets ΔE 11.5+ separation automatically and larger
   orgs degrade gracefully.
3. **The picker labels which colors are already taken and by whom**, so an
   owner can keep near-identical hues off the same day.

### Palette

Fixed slot order, computed by hill-climbing worst-case all-pairs separation in
both themes simultaneously, seeded from the strongest 6-set. Order is a
correctness mechanism, not cosmetic — do not re-sort it.

The final column is the worst all-pairs ΔE across slots 1..N — i.e. the
separation an org gets once it has N employees colored — not a property of the
individual hue.

| # | Slug | Accent light | Accent dark | Tint light | Tint dark | Worst ΔE at 1..N |
|---|---|---|---|---|---|---|
| 1 | `blue` | `blue-700` | `blue-500` | `blue-200` | `blue-900` | — |
| 2 | `rose` | `rose-700` | `rose-500` | `rose-200` | `rose-900` | 34.4 |
| 3 | `cyan` | `cyan-600` | `cyan-600` | `cyan-200` | `cyan-900` | 12.3 |
| 4 | `emerald` | `emerald-700` | `emerald-600` | `emerald-200` | `emerald-900` | 11.8 |
| 5 | `amber` | `amber-700` | `amber-600` | `amber-200` | `amber-900` | 11.5 |
| 6 | `fuchsia` | `fuchsia-700` | `fuchsia-500` | `fuchsia-200` | `fuchsia-900` | 11.5 |
| 7 | `teal` | `teal-600` | `teal-600` | `teal-200` | `teal-900` | 4.9 |
| 8 | `lime` | `lime-700` | `lime-600` | `lime-200` | `lime-900` | 4.9 |
| 9 | `sky` | `sky-700` | `sky-600` | `sky-200` | `sky-900` | 4.9 |
| 10 | `pink` | `pink-700` | `pink-500` | `pink-200` | `pink-900` | 4.6 |
| 11 | `red` | `red-700` | `red-500` | `red-200` | `red-900` | 3.5 |
| 12 | `green` | `green-700` | `green-600` | `green-200` | `green-900` | 3.5 |

Tints move from today's `-100`/`-950/60` to **`-200` light / `-900` dark** —
a modest deepening that preserves the existing look while roughly doubling
tint separation. Card text becomes `text-{hue}-900` / `dark:text-{hue}-100`.

Class strings must be written out in full and never interpolated —
Tailwind cannot compile `bg-${hue}-200`.

## Architecture

### `src/lib/employee-colors.ts` (new)

The single source of truth. Exports:

- `EMPLOYEE_COLOR_SLUGS` — the 12 slugs in fixed order (`as const`).
- `EmployeeColor` — union type derived from it.
- `EMPLOYEE_COLOR_CLASSES: Record<EmployeeColor, { card, accent, dot }>` —
  complete static Tailwind class strings per slot.
- `resolveEmployeeColor(employee)` — returns the employee's slot classes, or
  falls back to the existing role colors when `color` is null.
- `nextAvailableColor(taken)` — first slot in fixed order not present in
  `taken`; when all 12 are in use, returns `slots[taken.length % 12]`.

Role colors stay in this module as the documented fallback so a null `color`
renders exactly as it does today.

### Data

`employees.color` — nullable `text`, `CHECK` constrained to the 12 slugs.
Nullable so a null renders as today's role color, making the change
backwards-compatible with any row the migration misses.

`src/lib/cached-queries.ts` selects `employees.*`, so the column flows through
with no query change. `updateEmployee`/`createEmployee` spread `result.data`
into the write, so **no new server action is needed** — adding the field to
`employeeSchema` is sufficient.

### Migration `supabase/migrations/019_employee_colors.sql` (new)

Per this repo's convention, migrations are gitignored and run manually in the
Supabase SQL editor. 019 is the next free number (018 is the latest).

1. `alter table employees add column color text` + `CHECK` on the 12 slugs.
2. Backfill: assign slots by `row_number() over (partition by
   organization_id order by id)`, cycling the 12-slot array, for rows where
   `color is null`. Partitioning by org means every tenant starts at slot 1
   and small orgs get the best-separated colors. Archived employees are
   included so a restored employee already has a color.

### UI

`color-swatch-picker.tsx` (new) — a 12-swatch grid plus an "Auto" option
(clears to null → role fallback). Each swatch is a button rendering that
slot's accent color, selected state as a ring. Swatches held by another
employee show that person's first name beneath. Needs the roster: pass
`employees` into the dialogs — `employee-list.tsx:86` already holds the full
array, so this is one prop.

Render sites:

| File | Change |
|---|---|
| `shift-card.tsx` | Tint background + 4px left accent stripe + accent dot, from the employee's color; role stays as the text label. Name stays on the card. |
| `schedule-grid-client.tsx:100-105` | The 4 role dots become per-person dots (accent + name) for employees with shifts that week. Leaving a role legend would actively mislead once cards are person-colored. |
| `employee-list.tsx` | Accent dot beside the name so the owner can see assignments at a glance. |
| `edit-employee-dialog.tsx` | Color field after Role. |
| `add-employee-dialog.tsx` | Color field after Role. |

`createEmployee` assigns `nextAvailableColor` when the caller supplies none,
so new hires after the backfill also get a distinct color rather than
reverting to a role fallback.

### i18n

`src/lib/translations.ts`, all three languages (en/pl/uk): `forms.color`,
`forms.color_auto`, and `colors.<slug>` × 12 for swatch accessible labels.

## Out of scope

Stated explicitly so the implementation does not drift:

- **Role badges** in `stats-view-client.tsx:41` and
  `employee-schedule-view.tsx:41` keep role colors — they sit in a column
  headed "Role" and label the role, not the person.
- **Print views** (`monthly-print-view`, `individual-timesheet-view`) — name-per-row
  tables, intentionally `bg-white text-black`.
- **Recharts bar chart** on the stats page — its two colors encode
  hours-vs-cost (series), not identity. Employee colors there would collide
  with that encoding.
- **Custom roles.** `custom-roles-section.tsx` lets an org add roles, but
  `employeeSchema.role` is a hard `z.enum` of the 4 built-ins, so custom roles
  cannot be assigned to anyone. Pre-existing gap, unrelated to colors, left
  alone.
- **Free hex colors**, per-role palette editing, and a Settings-based bulk
  color editor were all considered and rejected.

## Verification

The repo has no test runner (`package.json` has `dev`/`build`/`start`/`lint`
only). Adding one is out of scope, so verification is build + manual:

1. `npm run lint` — clean.
2. `npm run build` — compiles.
3. Run `019_employee_colors.sql`; confirm every employee has a color and the
   `CHECK` rejects an invalid slug.
4. Two employees of the **same role**, different colors → visibly different
   cards on the grid. This is the acceptance criterion for the original
   complaint.
5. Toggle dark mode on the grid; confirm tints, accents, and card text all
   remain readable.
6. Set an employee to "Auto" → card renders in the role color exactly as
   before.
7. Grid legend lists the people scheduled that week, not the 4 roles.
8. Confirm the picker labels a color already held by someone else.
