# Puma (EDGE): Software Requirements Specification v3.0

| Field | Value |
|---|---|
| Version | **3.1, final baseline for the 10-day MVP** (v3.1: two student identity paths in the MVP, all profile fields required, website + Android first) |
| Supersedes | SRS v3.0, SRS v2.0 (`docs/archive/`) |
| Product doc | `03_PRD_v3.md` |
| Rule | Items marked **🔒 LOCKED** change only through a new entry in `logs/DECISIONS.md` (an ADR) |

---

## 1. Architecture 🔒

```
 ┌────────────── One Expo codebase (TypeScript, Expo Router) ──────────────┐
 │   iOS (Expo Go → PWA → App Store later)   Android (APK/Play)   Web (PWA) │
 └───────────────┬───────────────────────────────────────┬─────────────────┘
                 │ supabase-js (Auth, Data API, Realtime) │ static web build
                 ▼                                         ▼
 ┌──────────────────────── Supabase (free) ────────────────────┐  Cloudflare Pages
 │ Auth (Google + email/password, domain allow-list trigger)  │  (web hosting)
 │ Postgres + RLS + RPC functions (check_in, complete_event…) │
 │ Edge Functions (push fan-out, certificate verify, CSV)     │
 │ Supabase Cron (overdue approvals)  · Storage (avatars/logos)│
 └───────────────┬─────────────────────────────────────────────┘
                 │                         ┌──────────────────────────┐
                 ├──► Expo Push (FCM/APNs) │ GitHub Actions: CI, EAS, │
                 └──► Cloudflare R2 (if    │ keep-alive, pg_dump      │
                      storage > 1 GB)      └──────────────────────────┘
```

### 1.1 Stack 🔒
| Layer | Tech |
|---|---|
| Client | Expo SDK (latest stable), React Native, **Expo Router**, TypeScript strict |
| UI | NativeWind **or** Tamagui (choose on Day 0, record as ADR-002) |
| State/data | TanStack Query + supabase-js. Zod for validation. |
| QR | `expo-camera` (scan), `react-native-qrcode-svg` (render) |
| PDF | Web: print-to-PDF of a certificate route. Native: `expo-print` (HTML → PDF). |
| Backend | Supabase Postgres 15+, RLS, SQL migrations in `supabase/migrations` |
| Server functions | Postgres RPC first. Edge Functions (Deno) only for external calls (push). |
| Push | `expo-notifications` + Expo Push API. Web Push (VAPID) for the PWA. |
| Hosting | Cloudflare Pages (web) · EAS Build (APK/IPA) · EAS Update (OTA) |
| Observability | Sentry (free) + Supabase logs |
| Tests | Jest + React Native Testing Library · pgTAP (or SQL tests) for RLS · Playwright (web E2E) · Maestro (mobile E2E, optional) · k6 (load) |

### 1.2 Monorepo layout (proposed)
```
puma/
  app/                 Expo Router screens (web+native)
  src/components/      UI kit
  src/features/        auth, events, tickets, checkin, certificates, clubs, approvals
  src/lib/             supabase client, query hooks, i18n strings
  supabase/migrations/ SQL (tables + GRANTs + RLS + RPC)
  supabase/functions/  edge functions
  supabase/tests/      RLS & RPC tests
  e2e/                 Playwright / Maestro
  docs/  logs/  .claude/  .github/
```

---

## 2. Data model 🔒 (MVP, R1+R2)

| Table | Key columns | Notes |
|---|---|---|
| `profiles` | `id (=auth.uid)`, `full_name`, `parul_email` (nullable, unique), `personal_email`, `student_id` (**unique**, uppercase, format-checked), `institute_id`, `course`, `year`, `semester`, `phone`, `gender` (incl. `prefer_not_to_say`), `residence` (hosteller/day_scholar), `role` enum, `department_id`, `verification_status` (verified/unverified), `consent_at`, `onboarded_at`, `push_tokens jsonb` | A row is created by a trigger on sign-up. `onboarded_at` can only be set when every required field is non-null (CHECK constraint / RPC). |
| `departments` | `id`, `name`, `institute_id` | Seeded |
| `institutes` | `id`, `name` | Seeded subset + "Other" |
| `allowed_email_domains` | `domain` | Config table, so domains change without a deploy |
| `clubs` (R2) | `id`, `name`, `department_id`, `lead_id`, `advisor_id`, `status` (pending/approved/rejected/archived), `remarks` | |
| `club_members` (R2) | `club_id`, `user_id`, `joined_at` | PK (club_id, user_id) |
| `events` | `id`, `title`, `description`, `starts_at`, `ends_at`, `venue`, `department_id`, `club_id?`, `creator_id`, `creator_role`, `status` (draft/pending/published/rejected/completed/cancelled), `is_verified`, `remarks`, `checkin_code`, `completed_at`, `completed_by`, `cover_url` | |
| `registrations` | `id`, `event_id`, `user_id`, `status` (registered/cancelled), `ticket_code` (random, unique) | **UNIQUE(event_id, user_id)** |
| `attendance` | `id`, `registration_id` **UNIQUE**, `mode` (A/B/manual), `scanned_by`, `checked_in_at`, `added_post_completion` | The unique constraint is the duplicate guard |
| `certificates` | `id`, `attendance_id` **UNIQUE**, `serial` (human-readable), `issued_at`, `reissue_reason`, `snapshot jsonb` (name, event, issuer at issue time) | No file stored |
| `notifications` | `id`, `user_id`, `type`, `payload`, `read_at`, `critical bool` | In-app inbox + push log |
| `audit_log` | `id`, `actor_id`, `action`, `entity`, `entity_id`, `before`, `after`, `at` | Written by triggers on role, approval and completion changes |

**Every migration must include explicit `GRANT`s** (Supabase changed this for new projects on 2026-05-30 and for all projects on 2026-10-30) **and `ENABLE ROW LEVEL SECURITY`.** CI fails any table without RLS (§8).

---

## 3. Authentication and identity 🔒
Confirmed Parul domain: **`paruluniversity.ac.in`**, stored in `allowed_email_domains` (config, no hard-coding).

- **AUTH-1:** Sign-in methods are **Google OAuth** and **email + password** (with email confirmation). Both paths use the same methods.
- **AUTH-2 (Path A, Parul email):** if the sign-in email's domain is in `allowed_email_domains`, the sign-up trigger creates the profile with `parul_email = email` and `verification_status = 'verified'`.
- **AUTH-3 (Path B, student ID only):** any other email is accepted as a **personal email** and the profile is created with `verification_status = 'unverified'`. The user **cannot register for events until onboarding is complete**, and onboarding requires a valid `student_id`.
- **AUTH-4 (student ID rules):** normalised to uppercase with spaces removed. Must match `^[0-9]{2}[A-Z]{2,5}[0-9]{3,8}$` (e.g. `25UG030303`; PG and other codes are allowed). `UNIQUE` across all profiles. The year prefix must be ≤ the current year. On a duplicate, show "This ID is already registered. Contact support." The UI shows a confirmation step before submit.
- **AUTH-5 (link Parul email):** an unverified user can call `link_parul_email(email)`. Supabase sends a confirmation to that address (email change, or `linkIdentity` for Google). Once it's confirmed **and** the domain is allowed, a trigger sets `parul_email` and `verification_status='verified'` and writes to the audit log. If the Parul email already belongs to another account, the link is refused and the user is told to contact an admin (no auto-merge in the MVP).
- **AUTH-6 (staff):** `set_role()` refuses Faculty/AD/Admin roles for any profile without a verified `parul_email`.
- **AUTH-7:** Roles are raised only by Admin/AD through the `set_role()` RPC (audited). Super Admin is seeded by SQL.
- **AUTH-8 (onboarding):** `complete_onboarding(payload)` validates every required field (name, student ID, institute, course, year, semester, phone (Indian 10-digit), gender, residence, personal email, consent) and sets `onboarded_at`. `register_for_event` refuses users without `onboarded_at`.
- **AUTH-9 (abuse controls):** organizers and CSVs always show the Verified/Unverified tag. Admin can clear a disputed `student_id` (audited). Rate-limit sign-ups using Supabase Auth's built-in limits plus CAPTCHA only if abuse appears (R3).

## 4. Authorization (RLS) 🔒
| Table | Student | Club Lead | Faculty | AD | Admin+ |
|---|---|---|---|---|---|
| profiles (own) | R/W own (not `role`) | same | same | same | R/W all |
| profiles (others) | ✗ | R academic fields of their **event registrants / club members** via the `roster` view | same for own events | R all in dept (incl. phone) | R all |
| events | R `published`/`completed` + own | + CRUD own (status→pending) | + CRUD own (auto published+verified) | + CRUD dept, approve | all |
| registrations | CRUD own | R for own events | R own events | R dept | all |
| attendance | R own | write only via RPC | via RPC | via RPC | all |
| certificates | R own · public verify via RPC by serial | ✗ | ✗ | R dept | all |
| clubs | R approved | CRUD own pending | R | approve dept | all |

Field-level privacy (no phone, gender or personal email for Club Lead) is done with **security-definer views** (`event_roster_basic` vs `event_roster_full`) rather than column RLS.

## 5. Business functions (RPC) 🔒
| RPC | Who | Behavior |
|---|---|---|
| `register_for_event(event_id)` | student | Event must be published and not ended. Insert is idempotent (returns the existing row). Returns `ticket_code`. |
| `check_in_by_ticket(ticket_code)` | organizer of that event | **Mode A.** Validates that the event is live (starts_at − 2h … ends_at + 2h). `INSERT … ON CONFLICT (registration_id) DO NOTHING`. Returns `{status: 'ok'|'already', name, photo}`. |
| `self_check_in(event_id, checkin_code)` | student | **Mode B.** Student must be registered (**or auto-registered if the event allows walk-ins**). The code must match `events.checkin_code`, which the organizer can regenerate. Same idempotent insert. |
| `complete_event(event_id)` | organizer / AD | Sets `status='completed'` and issues certificates for all attendance rows in **one transaction**. Writes to the audit log. |
| `add_post_completion_attendance(event_id, user_id)` (R2) | organizer / AD | Inserts attendance flagged `added_post_completion` and issues one certificate |
| `decide_request(entity, id, decision, remarks)` | AD of dept / Admin | Approve or reject a club or event. On approve: event → published + verified. |
| `verify_certificate(serial)` | anon | Returns public, minimal data: name, event, date, issuer, valid |
| `export_event_csv(event_id)` | organizer / AD | Roster + attendance + unverified flag |

### 5.1 Concurrency (replaces the v2 queue)
- Duplicates are impossible because of `UNIQUE(registration_id)`. A race returns `already`, never an error.
- The client shows **optimistic success** after a 200 response. On a network error it retries with backoff (same code, so it is idempotent).
- **Load target:** 1,000 `self_check_in` calls in 60 s with p95 < 1.5 s and 0 errors (k6 test in CI-manual, §8).
- The QStash queue is dropped. It is reconsidered only if the k6 test fails (ADR required).

## 6. Notifications (R2)
- **NOTIF-1:** In-app inbox (the `notifications` table, Realtime subscription) is the source of truth.
- **NOTIF-2:** Push through the Expo Push API (Android, iOS dev builds) and Web Push for the installed PWA. Sent from an Edge Function triggered by a DB webhook on `notifications` insert.
- **NOTIF-3:** Critical types (event cancelled, time or venue changed) ignore user mute.
- **NOTIF-4:** Triggers: registration confirmed, event reminder (Cron, 2 h before), approved/rejected, certificate issued, event changed/cancelled.

## 7. Non-functional requirements
| ID | Requirement |
|---|---|
| NFR-1 | First load of the web app < 3 s on campus 4G/Wi-Fi (Lighthouse perf ≥ 80 mobile) |
| NFR-2 | Ticket QR viewable offline after the first load |
| NFR-3 | Accessibility: labels on all touchables, font scaling, contrast ≥ 4.5:1, status is never shown by colour alone |
| NFR-4 | All user-facing strings live in `src/lib/strings` (i18n-ready) |
| NFR-5 | No secrets in the client except the Supabase anon key. The service key lives only in Edge Function secrets and GitHub secrets. |
| NFR-6 | Backups: weekly `pg_dump` (GitHub Action) kept for 30 days. Restore is tested once before the pilot. |
| NFR-7 | Keep-alive: a daily ping so the free project never pauses |
| NFR-8 | iOS 16.4+ / Android 10+ / last 2 versions of evergreen browsers |
| NFR-9 | Every table has RLS enabled. CI checks this. |

## 8. Quality gates (CI must pass before merge)
1. Typecheck + lint + unit tests
2. `supabase db reset` on an ephemeral local DB + migrations + **RLS/RPC tests** (each role tries forbidden reads and writes and is expected to fail)
3. Check that every `public` table has RLS enabled
4. Web build succeeds. Playwright golden-path smoke against a preview.
5. On `main`: deploy web to Cloudflare Pages, run `supabase db push` to prod, publish an EAS Update to the `production` channel
6. Manual workflow: k6 load test of `self_check_in`

## 9. Edge cases
| Case | Behavior |
|---|---|
| Mode A + Mode B race | One row. The second caller gets "Already checked in". |
| Check-in outside the event window | Rejected: "Check-in opens 2 h before start" |
| Complete pressed twice | Idempotent. No duplicate certificates (UNIQUE attendance_id). |
| Student not registered scans the Mode B QR | Walk-in allowed? → auto-register + check-in. Otherwise "Register first", with a register button. |
| Screen QR photo shared on WhatsApp | MVP: the organizer regenerates the code. R3: rotating code + suspicious-activity flag. |
| ID-only student later gets a Parul email | `link_parul_email` → Verified, same account, history kept (AUTH-5) |
| Two people claim the same student ID | Second sign-up blocked. Admin resolves it and the reset is audited. |
| Name misspelled after a certificate was issued | Profile edit → certificate `snapshot` re-rendered on the next view, `reissue_reason='profile_update'` (R3) |
| AD deactivated with a pending queue | The queue is visible to Admin (dept filter). Formal reassignment comes in R3. |
| Supabase paused | Keep-alive prevents it. Runbook: unpause from the dashboard, cron jobs resume. |

## 10. Traceability (MVP)
| ID | Requirement | PRD story | Release | Built | Tested | Verified by manager |
|---|---|---|---|---|---|---|
| T01 | Sign-in: Path A (Parul email → Verified) + Path B (personal email + student ID → Unverified) | S1, S1b | R1 | ☐ | ☐ | ☐ |
| T02 | Full required profile (3 screens) + consent + ID validation | S2 | R1 | ☐ | ☐ | ☐ |
| T03 | RLS baseline + CI RLS check | n/a | R1 | ☐ | ☐ | ☐ |
| T04 | Create event (Faculty/AD, verified) | S9 | R1 | ☐ | ☐ | ☐ |
| T05 | Browse/search + register | S3 | R1 | ☐ | ☐ | ☐ |
| T06 | Ticket QR (offline cache) | S4 | R1 | ☐ | ☐ | ☐ |
| T07 | Mode A scan | S5 | R1 | ☐ | ☐ | ☐ |
| T08 | Complete → certificates | S7 | R1 | ☐ | ☐ | ☐ |
| T09 | Certificate view/PDF + public verify | S8 | R1 | ☐ | ☐ | ☐ |
| T10 | CSV export | S12 | R1 | ☐ | ☐ | ☐ |
| T11 | Clubs + Club Lead event requests | S10 | R2 | ☐ | ☐ | ☐ |
| T12 | AD approval queue | S11 | R2 | ☐ | ☐ | ☐ |
| T13 | Mode B self check-in + k6 pass | S6 | R2 | ☐ | ☐ | ☐ |
| T14 | Push + inbox | n/a | R2 | ☐ | ☐ | ☐ |
| T15 | Play Store submission (internal → production) + PWA install guide | n/a | R2 |
| T17 | Link Parul email → Verified | S1c | R2 | ☐ | ☐ | ☐ |
| T16 | Keep-alive + backup jobs | NFR-6/7 | R1 | ☐ | ☐ | ☐ |
