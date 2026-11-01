# AGENT_LOG (append-only)

Format: see docs/07_AGENT_PLAYBOOK.md §3.1. Newest entries at the bottom.

### [2026-10-09] planner (Claude) · PLAN · Three-level review of v2 docs
- **Status:** DONE
- **Did:** Level 1 assumptions audit, Level 2 sourced fact-check, Level 3 PRD/SRS v3, 10-day plan, system prompts, agent playbook, repo skeleton
- **Files:** docs/01–08, CLAUDE.md, AGENTS.md, .claude/agents/*, logs/*, .github/*
- **Evidence:** sources listed in docs/02_FACT_CHECK.md
- **Left off at:** Day 0 setup not started
- **Next:** Day 0 setup (see logs/HANDOFF.md)
- **Manager verdict:** pending review by Party A

### [2026-10-10] planner (Claude) · PLAN v3.1 · Apply Party A decisions
- **Status:** DONE
- **Did:** Renamed the product to EDGE. Confirmed the domain paruluniversity.ac.in. Moved both student identity paths into the MVP (SRS §3 AUTH-1..9). All profile fields required. Platform order website → Android → iPhone. Rebalanced lanes (Party B = frontend + DevOps + backend services). Updated TASKS (T03b, T10, T16, T18, T19, T17, R3-iOS). ADR-003…007.
- **Files:** docs/03, 04, 05, 06, 07, 08, README, CLAUDE.md, AGENTS.md, .claude/agents/*, logs/*, .github/CODEOWNERS
- **Evidence:** decisions from Party A in chat (2026-10-10)
- **Left off at:** Day 0 not started
- **Next:** Day 0 setup (logs/HANDOFF.md)
- **Manager verdict:** pending review by Party A

### [2026-10-10] planner (Claude) · DOC 09 · Setup guide added + fact-checked
- **Status:** DONE
- **Did:** Added docs/09_SETUP_GUIDE.md from Party A's draft with 3 corrections (Supabase CLI install, GitHub private-repo protection needs Pro, Play 12-tester/14-day rule). Updated docs/03, 05, 08, TASKS, DECISIONS (ADR-008), README, HANDOFF.
- **Evidence:** sources at the end of docs/09
- **Next:** Day 0 setup per docs/09
- **Manager verdict:** pending review by Party A

### [2026-10-15] planner (Claude) · D0 · Name fix + Day 0 start
- **Status:** PARTIAL
- **Did:** Renamed HADGE → EDGE in the repo (19 files) and in the Drive docs (Google Docs replace). ADR-003 updated. Re-baselined the calendar (R1 21 Oct, pilot 25 Oct). Tried to create Supabase `edge-prod` (ap-south-1, $0).
- **Evidence:** Supabase API: "manav-Mnv (2 project limit)", so the project was not created.
- **Left off at:** waiting for Party A to free a Supabase project slot
- **Next:** see logs/HANDOFF.md
- **Manager verdict:** pending

### [2026-10-15] planner (Claude) · D0-2 · Supabase edge-prod created
- **Status:** DONE (public part)
- **Did:** Created `edge-prod` (ap-south-1, $0, ref zhgjmecutkdwtswrdzhc). Set 3 public GitHub secrets. Added `.env.example` + local `.env`.
- **Evidence:** create_project → ACTIVE_HEALTHY. `gh secret list` shows 3 secrets.
- **Next:** Party A adds the 3 private Supabase secrets (DB password, service-role, access token)
- **Manager verdict:** pending

### [2026-10-15] Manager (Claude) · D0-3, T01/T02/T03/T03b/T18 · Day 1 foundation
- **Status:** PARTIAL (in review)
- **Did:** Repo public + `protect-main` ruleset. PR #1: Expo SDK 57 app skeleton, sign-in, identity migration, pgTAP + Jest tests, CI.
- **Evidence:** `tsc --noEmit` exit 0 · `expo lint` clean · `jest` 6 passed · `expo export --platform web` 11 routes · browser: `/` redirects to `/sign-in`, which renders
- **Left off at:** waiting for CI on PR #1 (pgTAP is not run locally because Docker didn't start)
- **Next:** apply the migration to edge-prod after CI is green, then merge
- **Manager verdict:** pending CI

### [2026-10-31] Manager (Antigravity) · D0-2, D0-7, T01, T03, T03b · Accounts, Live Migration & Day 1 Merge
- **Status:** DONE
- **Did:** Added remaining private GitHub secrets (`SUPABASE_ACCESS_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `EXPO_TOKEN`). Connected Google OAuth. Deployed live web app to Cloudflare (`https://edge-parul.manavbarad978.workers.dev`). Applied identity migration (`20261015000001_identity.sql`) to Supabase `edge-prod`. Regenerated TypeScript types. Added `app` and `db` required status checks to `protect-main` ruleset. Verified all CI checks passed. Merged PR #2 to `main`.
- **Evidence:** Supabase query returns `profiles`, `institutes`, `departments`, `allowed_email_domains` · CI runs `app` (1m10s pass) and `db` (2m24s pass) · PR #2 merged into `main` · web app 200 OK at live URL.
- **Next:** Day 2: 3-step onboarding screens (T02 frontend), onboarding auth guard, and Cloudflare Pages CI/CD deploy workflow.
- **Manager verdict:** APPROVED


### [2026-10-31] Manager (Claude) · T02, T03b, T16, T04, T05 · Day 2 + Day 3
- **Status:** PARTIAL (in review)
- **Did:** PR #5: onboarding + guard, deploy/keepalive/backup/mobile-build workflows, eas.json, ADR-002/009. PR #6: events migration + pgTAP 002, Explore/detail/Create screens, IST helpers. Invited Party B (hemantooo).
- **Evidence:** PR #5 CI app ✅ db ✅. Local for #6: tsc exit 0, lint clean, jest 15 passed, web export 13 routes.
- **Left off at:** merge blocked pending Party A review; events migration not yet on edge-prod
- **Next:** see HANDOFF
- **Manager verdict:** pending Party A merge

### [2026-10-31] Manager (Claude) · T06, T07 · Day 4
- **Status:** PARTIAL (in review, PR #7)
- **Did:** attendance + check_in_by_ticket + admin_find_profiles migration, pgTAP 003, Tickets tab with offline QR, scanner screen, admin roles screen.
- **Evidence:** tsc exit 0, lint clean, jest 22 passed, web export 15 routes
- **Next:** Party A merges #5 → #6 → #7. Then apply migrations to edge-prod and start Day 5.
- **Manager verdict:** pending Party A merge

### [2026-10-31] Manager (Claude) · T08, T09 + deploy fix · Day 5
- **Status:** PARTIAL (in review)
- **Did:** Merged Days 2–4 (#7, rebase), closed #5/#6. Diagnosed the deploy failure (Wrangler 3.90, missing entry-point) → PR #8 (Wrangler 4 + db-deploy workflow). Day 5: certificates migration + pgTAP 004, complete flow, certificate view/PDF, public verify page.
- **Evidence:** deploy log "Missing entry-point" (run on main). Day 5 local: tsc exit 0, lint clean, jest 26 passed, web export 18 routes.
- **Next:** #8 → db-deploy → Day 5 merge → db-deploy
- **Manager verdict:** pending CI

### [2026-11-01] Manager (Claude) · Day 6 · blank-screen fix, E2E, CI polish
- **Status:** DONE (pending Party A db-deploy)
- **Did:** Root cause of the blank page: 2 auth users predate the identity migration, so they had no profile, and the app rendered nothing during retries. #11 adds the backfill + self-healing onboarding + loading/error screens, and pins the Supabase CLI (setup-cli `latest` hit the rate limit). #10: Playwright golden-path E2E in CI. #12: actions v5, preview_urls off.
- **Evidence:** SQL: auth_users=2, profiles=0, users created 12:07/12:08 on 31 Oct. #11 CI ✅. #10 CI app ✅ db ✅ **e2e ✅** (first run). Jest 27/27.
- **Next:** Party A runs db-deploy, then tag v0.1.0
- **Manager verdict:** VERIFIED (CI evidence)

### [2026-11-01] Manager (Claude) · T02, T11–T15, T17 · Days 7–10
- **Status:** DONE (pending Party A db-deploy)
- **Did:** #13 enrollment-number IDs. #15 (incl. Day 7): Manage portal, Super Admin console, clubs + approvals, enrollment upgrade on Parul email link, Mode B self check-in, notifications inbox. Day 9–10: PWA manifest + install guide, logs, release prep. APK build started.
- **Evidence:** CI #13, #14/#15: app ✅ db ✅ e2e ✅. Jest 33. pgTAP 001–008. Web export 24 routes with manifest.
- **Next:** Party A: db-deploy, super_admin, SMTP, pilot. Backlog: push, faculty onboarding, CSV, k6.
- **Manager verdict:** VERIFIED (CI evidence)
