# 10-Day Execution Plan: Party A / Party B

**Rule #1:** R1 (golden path) must be done and verified before any R2 work starts.
**Rule #2:** Every task has a lane (A or B), an ID, and acceptance criteria, and lives in `logs/TASKS.md`.
**Rule #3:** If Party B misses a checkpoint, Party A takes the B-lane using the cut-list. This is planned, not a crisis.

## Who does what

| | **Party A: Manav (Lead / Backend / DevOps / Agent Manager)** | **Party B: Co-developer (Frontend / UI / Design-to-code)** |
|---|---|---|
| Owns | Supabase schema, RLS, RPCs, auth, edge functions, certificates logic, CI/CD, releases, `logs/`, merging PRs | Expo screens, UI kit, navigation, forms, QR scanner UI, certificate layout, PWA polish, accessibility |
| Interface contract | Publishes **typed hooks** in `src/lib/api/*` (e.g. `useEvents()`, `useRegister()`, `checkInByTicket()`) with mock data on Day 1 | Builds screens **against those hooks/mocks only**, never calling Supabase directly |
| Reviews | All B PRs (as code owner) | A's UI-facing PRs (optional) |

Because B codes against mocks, **A can swap in the real backend, or take over B's screens, without anything breaking.**

## Day 0: setup (today, ~3 h, both)
| ID | Lane | Task | Done when |
|---|---|---|---|
| D0-1 | A | Re-verify pricing (checklist in `02_FACT_CHECK.md` §4). **Confirm the student email domain.** | Logged in DECISIONS |
| D0-2 | A | Create Supabase project (Mumbai/Singapore region), GitHub secrets, Cloudflare Pages, Expo account, Sentry | Keys in GitHub secrets, `.env.example` committed |
| D0-3 | A | Add B as repo collaborator. Branch protection on `main` (PR + CI required). | B can open a PR |
| D0-4 | B | Confirm the Figma design system. Pick NativeWind vs Tamagui (ADR-002). Pick a light glass style. | ADR written |
| D0-5 | both | Each sets up an AI assistant with their system prompt (`06_SYSTEM_PROMPTS.md`) | Sanity prompt run |

## Release R1: Golden Path (Days 1–6)

| Day | Party A | Party B | Checkpoint |
|---|---|---|---|
| **1** | Expo app scaffold (Router, TS, lint, Jest), CI skeleton, migrations: profiles/departments/institutes/allowed domains + GRANTs + RLS, domain trigger. **Mock API hooks published.** | UI kit (Button, Input, Card, Badge, Avatar, Screen, Toast), theme tokens from Figma, tab layout (Explore / Tickets / Create / Profile) | Scaffold builds on web + Android |
| **2** | Auth (Google + email), sign-in errors, onboarding RPC, consent, RLS tests | Sign-in screen, 3-step onboarding UI (seeded institute list), profile screen | 🔶 **Checkpoint B1:** has B merged ≥ 1 real screen PR? If not → solo mode warning |
| **3** | `events` + `registrations` tables, RLS, `register_for_event`, create-event API, audit triggers | Explore feed (search, filter), event detail, create-event form, Verified badge | A user can create → see → register (web) |
| **4** | `ticket_code`, `check_in_by_ticket`, event window rules, roster views, CSV export | My Tickets + QR (offline cache), scanner screen (`expo-camera`) with ✅/⚠️ states and haptics | Scan works phone → phone |
| **5** | `complete_event` + certificate issue, `verify_certificate`, keep-alive + backup Actions | Certificate design (HTML template → PDF), certificate list, public `/verify/[serial]` page | 🔶 **Checkpoint B2:** are B's R1 screens ≥ 70% merged? If not → **solo mode ON** |
| **6** | E2E (Playwright) golden path, bug bash, deploy web prod + Android APK | Polish, empty/loading/error states, accessibility pass | ✅ **R1 exit:** a real student completes the loop on web + Android |

## Release R2: Pilot (Days 7–10)

| Day | Party A | Party B | Checkpoint |
|---|---|---|---|
| **7** | clubs, club_members, `decide_request`, Club Lead event → pending, overdue cron | Club pages, request-club form, AD approval queue UI, status chips | AD approves a Club Lead event |
| **8** | `self_check_in` + `checkin_code`, **k6 load test (1,000 / 60 s)**, notifications table + push edge function | Mode B "screen display" page (big QR, live counter via Realtime), student self-scan flow, inbox screen, push permission UX | k6 p95 < 1.5 s |
| **9** | Security review (RLS attempts per role), Sentry, backup restore drill, EAS production builds | PWA manifest + iPhone install guide, web push, final UI polish, store screenshots | Release candidate tagged `v0.9.0` |
| **10** | Release: web prod, APK link, EAS Update, runbook, onboard the Swift Coding Club organizer | Demo walkthrough, quick user guide (1 page), feedback form link | ✅ **R2 exit:** a real club event end to end |

## Solo mode (Party B didn't contribute)

Party A follows the same plan with agents doing B-lane work, **but cuts**:

| Keep (must) | Cut to R3 |
|---|---|
| Auth + onboarding, events, register, ticket, Mode A scan, complete, certificate + verify, CSV | Clubs + approval flow (Faculty/AD events only) |
| Web + Android APK + iPhone PWA | Mode B (use Mode A with 2–3 scanners instead) |
| Keep-alive, backups, CI | Push (in-app inbox only) |
| Basic UI kit (stock NativeWind components) | Custom glass design, animations |

If B joins later, they take R3 items from `logs/TASKS.md` in the B-lane with no rework.

## Branching and git workflow
- `main` is protected and always deployable. `dev` is optional (skip it for 2 people).
- Branch names: `feat/T05-register`, `fix/…`, `chore/…`, `docs/…`. **The task ID is always in the name.**
- Commits follow Conventional Commits: `feat(events): register RPC (T05)`.
- Small PRs (< 400 lines) using the PR template checklist. CI green + 1 approval (or the manager agent's review in solo mode) before merging.
- Tags: `v0.1.0` R1, `v0.9.0` RC, `v1.0.0` pilot.

## Daily rhythm (15 min)
1. **Start:** read `logs/HANDOFF.md` and pick a task from `logs/TASKS.md`.
2. **Work:** use the agent loop (`07_AGENT_PLAYBOOK.md`).
3. **End:** update `TASKS.md`, append to `AGENT_LOG.md`, rewrite `HANDOFF.md`, push.
4. Post a 3-line async standup in your group chat: *Done / Next / Blocked*.
