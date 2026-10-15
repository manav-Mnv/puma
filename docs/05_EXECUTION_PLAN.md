# 10-Day Execution Plan: Party A / Party B (v3.1)

**Rule #1:** R1 (golden path, **website + Android APK**) must be done and verified before any R2 work starts.
**Rule #2:** Every task has a lane (A or B), an ID, and acceptance criteria, and lives in `logs/TASKS.md`.
**Rule #3:** If Party B misses a checkpoint, Party A takes the B-lane using the cut-list. This is planned, not a crisis.

**Calendar (re-baselined 2026-10-15):** Day 0 = Wed 15 Oct · Day 1 = Thu 16 Oct · **R1 (Day 6) = Tue 21 Oct** · **Pilot (Day 10) = Sat 25 Oct** · Play public ≈ Tue 4 Nov (Day 20). If Day 0 slips, shift every date by the same amount.

**Platform priority:** 1) Website, 2) Android (APK → Play Store), 3) iPhone App Store later from the same code.

## Who does what

| | **Party A: Manav (Lead · Core Backend · Agent Manager)** | **Party B: Co-developer (Frontend owner · DevOps · Backend services)** |
|---|---|---|
| **Backend** | Core data and security: schema + migrations, **RLS**, **auth (both student paths)**, student-ID validation, all business RPCs (register, check-in A/B, complete, certificates, approvals, link Parul email), audit log | **Backend services:** Edge Functions for **push sending**, **CSV export**, **event reminders (cron)**, **notification triggers**. **Seed data** (institutes, courses, departments). Storage buckets + policies for avatars/covers. |
| **Frontend** | Auth + onboarding screens only (tightly coupled to the two identity paths) | **Owns the frontend and decides how it's built:** UI kit, design system, navigation, every other screen, QR scanner UI, certificate layout, PWA, accessibility |
| **DevOps** | Reviews and approves prod actions | **Owns DevOps:** GitHub Actions CI/CD, Cloudflare Pages, Supabase CLI deploys, EAS Build/Update, **Play Store listing + release**, keep-alive + backup jobs, Sentry, k6 load test, runbook |
| **Process** | Architecture, ADRs, task board, PR reviews (code owner of `supabase/migrations`), agent pipeline | PR reviews of A's UI-facing changes, code owner of `.github/`, `app/`, `src/components/` |
| **Interface contract** | Publishes **typed hooks** in `src/lib/api/*` with mocks on Day 1, and the DB schema as generated TypeScript types | Builds screens against those hooks/mocks only. Edge functions use only documented tables/RPCs. |

Because B codes against mocks and owns separate folders, **A can take over any B-lane piece without anything breaking.**

## Day 0: setup (today, ~3 h)
| ID | Lane | Task | Done when |
|---|---|---|---|
| D0-1 | A | ~~Confirm email domain~~ ✅ `paruluniversity.ac.in`. Confirm **faculty** use the same domain. Re-verify pricing (`02_FACT_CHECK.md` §4). | Logged in DECISIONS |
| D0-2 | **B** | Create accounts: Supabase project (Mumbai region), Cloudflare Pages, Expo/EAS, Sentry. Add GitHub secrets. `.env.example`. | Secrets in GitHub, A has admin access to every account |
| D0-3 | A | Add B as repo collaborator. **Apply for the GitHub Student Developer Pack** (free Pro → branch protection on a private repo), or make the repo public. Then protect `main`. | B can open a PR. Protection on once Pro is active. |
| D0-4 | B | Confirm the Figma design system. Pick NativeWind vs Tamagui (ADR-002). Light glass style. | ADR written |
| D0-5 | both | Each sets up an AI assistant with their system prompt (`06_SYSTEM_PROMPTS.md`) | Sanity prompt run |
| D0-6 | A | Sponsor pays **Google Play $25**. **Create the Play Console account on Day 0–1** (ID verification takes days). Collect 15–20 tester Gmail addresses from Swift Coding Club. | Account verified, tester list ready |

## Release R1: Golden Path (Days 1–6)

| Day | Party A | Party B | Checkpoint |
|---|---|---|---|
| **1** | Expo app scaffold (Router, TS, lint, Jest). Migrations: profiles (all fields), departments, institutes, allowed domains + GRANTs + RLS. Sign-up trigger (Path A Verified / Path B Unverified). **Mock API hooks + generated types published.** | **CI pipeline** (typecheck, lint, test, `supabase db reset` + tests). UI kit + theme tokens + tab layout (Explore / Tickets / Create / Profile). **Seed** institutes/courses/departments. | Scaffold builds on web + Android, CI green |
| **2** | Auth (Google + email/password) for both paths, student-ID validation + uniqueness, `complete_onboarding`, consent, RLS tests. **Sign-in + 3-step onboarding screens.** | **Web deploy pipeline** (Cloudflare Pages previews per PR + prod). Profile screen, Explore skeleton. | 🔶 **Checkpoint B1:** CI + web preview live, and ≥ 1 real screen merged? If not → solo warning |
| **3** | `events` + `registrations`, RLS, `register_for_event` (requires onboarding), create-event RPC, audit triggers | Explore feed (search, filter), event detail, create-event form, Verified badge. **EAS build profile** (Android APK). | A user can create → see → register (web) |
| **4** | `ticket_code`, `check_in_by_ticket`, event window rules, roster views (basic/full) | My Tickets + QR (offline cache), scanner screen (✅ / ⚠️ already / Unverified tag), **CSV export Edge Function** + download button | Scan works phone → phone |
| **5** | `complete_event` + certificate issue, `verify_certificate` | Certificate design (HTML → PDF), certificate list, public `/verify/[serial]` page. **Keep-alive + weekly backup Actions.** | 🔶 **Checkpoint B2:** are B's R1 items ≥ 70% merged? If not → **solo mode ON** |
| **6** | Playwright golden path for **both** student paths, RLS/security bug bash | Polish (empty/loading/error states), accessibility. **Release: website prod + Android APK link.** Sentry wired. **Upload the first build to the Play closed-testing track and invite 15–20 testers** (starts the 14-day clock). | ✅ **R1 exit:** a Parul-email student and an ID-only student each complete the loop on the website + Android |

## Release R2: Pilot (Days 7–10)

| Day | Party A | Party B | Checkpoint |
|---|---|---|---|
| **7** | clubs, club_members, `decide_request`, Club Lead event → pending, overdue cron | Club pages, request-club form, AD approval queue UI, status chips. **Play Console: store listing, privacy policy URL, data-safety form.** Closed-test build updated. | AD approves a Club Lead event |
| **8** | `self_check_in` + `checkin_code`, `link_parul_email` flow (T17) | Mode B "screen display" page (big QR, live counter), self-scan flow, inbox. **Push Edge Function + reminder cron.** **k6 load test (1,000 / 60 s).** | k6 p95 < 1.5 s |
| **9** | Security review (RLS escape attempts per role, ID-squatting cases), backup restore drill | PWA manifest + install guide, web push, final polish, Play Store screenshots, **closed-test build = RC** | Release candidate `v0.9.0` |
| **10** | Onboard the Swift Coding Club organizer, monitor live, hotfixes | Release: web prod, EAS Update, runbook, 1-page user guide, feedback link. Pilot testers install from **Play closed testing**. | ✅ **R2 exit:** a real club event end to end |

## After Day 10: Play Store public (~Day 20)
Once 12+ testers have been opted in for 14 days in a row, apply for production access → Google review → public on the Play Store. (Personal-account rule. An organization account with a D-U-N-S number is exempt.)

## After Day 10 (R3): iPhone
Apple Developer enrollment (sponsor pays) → `eas build -p ios` from the **same codebase** → TestFlight → App Store review. Expect about a week, mostly Apple review and account verification. Then the R3 backlog in the PRD.

## Solo mode (Party B didn't contribute)

Party A follows the same plan with agents doing the B-lane work (`frontend-dev` + `release-manager` agents), **but cuts**:

| Keep (must) | Cut to R3 |
|---|---|
| Both sign-up paths, full profile, events, register, ticket, Mode A scan, complete, certificate + verify, CSV | Clubs + approval flow (Faculty/AD events only) |
| Website + Android APK + Play closed testing (it only needs an upload + testers) | Mode B (use Mode A with 2–3 scanners) |
| CI (one workflow) + web deploy + keep-alive + backup | Push (in-app inbox only), k6, Sentry |
| Stock UI kit | Custom glass design, animations |

If B joins later, they pick up items from `logs/TASKS.md` in the B-lane with no rework.

## Branching and git workflow
- `main` is protected and always deployable.
- Branch names: `feat/T05-register`, `fix/…`, `chore/…`, `ci/…`, `docs/…`. **The task ID is always in the name.**
- Commits follow Conventional Commits: `feat(events): register RPC (T05)`.
- Small PRs (< 400 lines) using the PR template. CI green + 1 approval from the other party (or the manager agent in solo mode).
- Tags: `v0.1.0` R1, `v0.9.0` RC, `v1.0.0` pilot.

## Daily rhythm (15 min)
1. **Start:** read `logs/HANDOFF.md` and pick a task from `logs/TASKS.md`.
2. **Work:** use the agent loop (`07_AGENT_PLAYBOOK.md`).
3. **End:** update `TASKS.md`, append to `AGENT_LOG.md`, rewrite `HANDOFF.md`, push.
4. Post a 3-line async standup in your group chat: *Done / Next / Blocked*.
