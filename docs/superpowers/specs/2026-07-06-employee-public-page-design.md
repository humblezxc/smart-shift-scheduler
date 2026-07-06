# Employee Public Page — Design

**Date:** 2026-07-06
**Status:** Approved by owner
**Context:** The app is owner-operated. Employees never register; they get a tokenized public link (`/s/[token]`). This spec covers fixing the currently broken share feature, adding a subscribable calendar feed, request-to-owner flows, share-dialog improvements, a visual redesign of the public page, and free-tier performance wins.

## Decisions (owner-confirmed)

- Shift change = **message to owner** (no colleague-swap machinery). Owner reshuffles manually.
- Link TTL: **1 year** default (revocable/rotatable any time).
- Design direction: **calm & professional**, mobile-first.
- No registration for employees, ever. Token links only, with selectable language.

## Root cause of the broken share feature

On Supabase, `pgcrypto` is installed in the `extensions` schema. Migration 015's RPCs pin `SET search_path = public`, so `gen_random_bytes()` / `digest()` fail at runtime with "function does not exist" (confirmed by the owner's error toast). The migration itself ran fine because the SQL-editor session search path includes `extensions`. Affected functions: `resolve_share_token`, `get_shifts_by_share_token`, `create_public_time_off_request`, `rotate_share_token`. All share links — generating and resolving — are dead on prod until fixed.

## Phase 0 — Migration `018_fix_pgcrypto_search_path.sql` (owner runs manually)

`CREATE OR REPLACE` the four affected functions with `SET search_path = public, extensions`. Additive only; same signatures, so existing GRANTs survive. Folds in:

- 017's `timezone` key in `resolve_share_token`'s success payload.
- `rotate_share_token` default TTL 90 → 365 days.

App-side: `rotateEmployeeShareLink(employeeId, ttlDays = 90)` default changes to 365.

## Phase 1 — Calendar feed (ICS)

**Route:** `GET /s/[token]/calendar.ics?lang=<en|pl|uk>` (App Router route handler).

- Resolves token via `resolve_share_token` (404 on invalid/revoked/expired; the access-count bump from calendar pollers is acceptable — it is real access).
- Fetches shifts via `get_shifts_by_share_token`, window −7 to +90 days.
- Emits RFC 5545 ICS: UTC `DTSTART`/`DTEND` (clients display in local zone), `UID: shift-<id>@<host>`, `DTSTAMP`, `X-WR-CALNAME` localized ("Shifts — <first name>"), `X-PUBLISHED-TTL:PT12H`, CRLF line endings, escaped text.
- `SUMMARY` localized: shift times + day task, e.g. `Зміна 05:30–14:30 · 📦 Палета`. Day-task weekday computed in the org timezone (same `toZonedTime` pattern as the page).
- Headers: `Content-Type: text/calendar; charset=utf-8`, `Cache-Control: public, max-age=0, s-maxage=3600`.

**Page UX:** "Subscribe in Google Calendar" button (deep link `https://calendar.google.com/calendar/u/0/r?cid=<webcal feed URL>`) + copy-URL fallback for Apple/Outlook. Per-shift one-tap Google button stays.

## Phase 2 — Requests to owner (no DB changes)

Reuses public RPC `create_public_time_off_request(p_token, p_date, p_reason)`.

- **"Can't work a day"** (existing) gains an optional note field. Reason stored: note or localized default.
- **"Request change"** per shift card (replaces the crude reject-shift button): dialog pre-filled with that shift's date/time, optional note. Reason stored: `Shift change (05:30–14:30): <note>`.
- Owner sees both in the existing dashboard requests panel (date + reason + name). No new tables, no approval workflow.

## Phase 3 — Share dialog

- Language picker (EN/PL/UK) controlling the `?lang=` of generated URLs; defaults to the owner's current UI language.
- After generating: two copy rows — page link and calendar-feed link.
- TTL default comes from Phase 0 (365 days); expiry date shown.

## Phase 4 — Public page redesign (calm & professional)

Rework `employee-schedule-view.tsx` mobile-first, same stack (Tailwind + shadcn + next-themes):

- Header: name, role chip, week-hours summary chips; timezone shown subtly.
- Shift cards: morning/evening accent, day-task tag, "Today" highlight, per-card actions (Add to calendar, Request change).
- Prominent but calm "Subscribe calendar" and "Can't work a day" actions.
- Dates localized with date-fns locales (`uk`/`pl`/`enUS`) — currently weekday/month names render in English regardless of link language.
- New translation keys added for en/pl/uk.

## Phase 5 — Performance (free Vercel + free Supabase)

1. Middleware stops calling Supabase Auth over the network on every request: local JWT verification via `getClaims()` if the installed supabase-js supports it for this project's key type; otherwise a session-presence fast path (pages still do real verification via `requireAuth`/RLS — middleware is only a gate).
2. Org settings cached cross-request via the existing `cacheTags` infra (`cached-queries.ts` pattern), invalidated in `updateSettings`.
3. Region colocation: owner checks Supabase project region; set matching Vercel function region (`vercel.json` `regions` or dashboard). Instructions delivered with implementation.

## Error handling

- ICS route: invalid/expired token → 404 (no info leak); RPC failure → 503 with no body detail.
- Public request submissions: existing RPC error strings surface as toasts (already localized fallbacks).
- Share dialog keeps detailed error toasts (they just diagnosed a prod bug — keep them).

## Verification

- `npm run build` + `npm run lint` per phase.
- ICS: unit-style fixture check (generate → parse fields) via a scratch script; manual validation in Google Calendar after deploy.
- Share flow click-test on Vercel preview after the owner runs migration 018.
- No destructive DB operations anywhere; migration is additive and manual.

## Out of scope

- Colleague-to-colleague shift swaps and approval workflows.
- Employee accounts/notifications (email/push) — owner checks the dashboard.
- Payroll/rates on the public page (never expose compensation).
