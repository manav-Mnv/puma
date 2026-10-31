# HANDOFF: resume point (overwrite at every stop)

**Updated:** 2026-10-31 · **By:** Claude (Manager) · **Phase:** Days 2–4 built, waiting for Party A to merge (#5 → #6 → #7)

## State
- **PR #5 (Day 2)**: onboarding (3 steps + guard), `deploy.yml` (web → Cloudflare Worker `edge-parul`), `keepalive.yml`, `backup.yml`, `eas.json` + `mobile-build.yml` (Android APK). CI ✅ app + db. **Waiting for Party A to merge.**
- **PR #6 (Day 3)**, stacked on #5: events + registrations migration (`20261031000001_events.sql`), pgTAP 002 (18 tests), Explore / event detail / Create screens. Local: tsc ✅, lint ✅, jest 15/15 ✅, web export 13 routes ✅.
- **PR #7 (Day 4)**, stacked on #6: attendance + `check_in_by_ticket` + admin search (`20261101000001_checkin.sql`, pgTAP 003 with 15 tests), Tickets tab (offline QR), scanner `/event/[id]/scan`, `/admin/roles`. Local: tsc ✅ lint ✅ jest 22/22 ✅ web 15 routes ✅.
- The events and check-in migrations are **NOT applied to edge-prod** yet. Apply it after #6's CI is green and it's merged.
- Party B `hemantooo` invited (write). CODEOWNERS updated in #5.
- Decisions: ADR-002 (no UI library) and ADR-009 (faculty domain = paruluniversity.ac.in, flexible ID codes, store accounts deferred, testing via web + APK + Expo Go).

## Next (in order)
1. **Party A:** merge PR #5 (squash). The website auto-deploys from `deploy.yml`, so check the Actions tab is green.
2. Rebase #6 on main: `git rebase --onto origin/main feat/T02-onboarding-deploy feat/T04-T05-events`, then force-push. Wait for CI, then Party A merges.
3. Apply `20261031000001_events.sql` to edge-prod (Supabase MCP `apply_migration`) and regenerate `src/lib/api/database.types.ts`.
4. Party A: make yourself super_admin once (SQL in PR #6), promote faculty with `set_role`, create a test event.
5. Run the **mobile-build** workflow, install the APK, and test on an iPhone with Expo Go (`npx expo start`).
6. After #7: apply `20261101000001_checkin.sql` to edge-prod. Next is Day 5: mark complete → certificates + `/verify` page.

## Open questions
Real institute/course list (Party A collecting). Program codes beyond UG/PG (flexible for now).
