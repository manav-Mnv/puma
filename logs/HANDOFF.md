# HANDOFF: resume point (overwrite at every stop)

**Updated:** 2026-10-31 · **By:** Claude (Manager) · **Phase:** Day 6 in progress (E2E PR open)

## State
- `main` has Days 1–4: onboarding, events, register, tickets (offline QR), Mode A scanner, admin roles, workflows (deploy/keepalive/backup/mobile-build). PRs #5 and #6 were closed because they landed via #7.
- **deploy failed** on main (Wrangler 3.90 can't deploy an assets-only Worker). **PR #8** pins Wrangler 4 and adds the manual `db-deploy` workflow. Auto-merge is on.
- edge-prod has only the `identity` migration. **Pending:** `20261031000001_events`, `20261101000001_checkin`, and (after Day 5 merges) `20261101000002_certificates`. Apply them with the **db-deploy** workflow, which takes a backup first and keeps version numbers in sync.
- **Day 5 PR** (`feat/T08-T09-certificates`): certificates table, `complete_event`, public `verify_certificate`, pgTAP 004 (13 tests). Screens: Mark complete (2-tap confirm), My certificates, certificate view + PDF download (print on web, expo-print + share on native), public `/verify/[serial]`. Local: tsc ✅ lint ✅ jest 26/26 ✅ web export 18 routes ✅.

## Next (in order)
1. #8 merges → `deploy` re-runs (check it's green) → run **db-deploy** (Actions → db-deploy → Run workflow).
2. Day 5 PR CI green → merge → run db-deploy again (certificates migration).
3. Regenerate `src/lib/api/database.types.ts` from edge-prod.
4. Party A: make yourself super_admin (SQL), create an event, register with a second account, scan, complete, open the certificate, scan its QR.
5. Run **mobile-build** for an Android APK.
6. Day 6: R1 hardening. Playwright golden-path E2E, bug bash, empty/error states, accessibility pass, R1 release tag v0.1.0.

## Open questions
Real institute/course list. Program codes beyond UG/PG.

## Day 6 status (2026-10-31)
- Live: website deployed (Wrangler 4 + new Workers token), edge-prod has all 4 migrations (identity, events, checkin, certificates). Days 1–5 are on main.
- Open: branch `feat/T19-e2e-r1`. Playwright golden-path E2E (`e2e/golden-path.spec.ts`) plus a CI `e2e` job against local Supabase. Ticket code is shown under the QR as the manual-scan fallback. **Not yet green in CI. Iterate on failures** (selectors, `supabase status` env names).
- Left for Day 6: fix the E2E until it's green, bump actions to v5 (Node 20 deprecation), set `preview_urls: false` in wrangler.jsonc, accessibility pass, tag `v0.1.0`.
- Known gap: faculty go through the student onboarding (student ID required). Faculty/AD onboarding (MIS ID, designation) is still to do.
- Party A: enable leaked-password protection if your plan allows it. Regenerate `database.types.ts` from edge-prod (the hand-written one matches for now).
