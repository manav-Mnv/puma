# HANDOFF: resume point (overwrite at every stop)

**Updated:** 2026-10-31 · **By:** Claude (Manager) · **Phase:** Day 2 + Day 3 built, waiting for Party A to merge

## State
- **PR #5 (Day 2)**: onboarding (3 steps + guard), `deploy.yml` (web → Cloudflare Worker `edge-parul`), `keepalive.yml`, `backup.yml`, `eas.json` + `mobile-build.yml` (Android APK). CI ✅ app + db. **Waiting for Party A to merge.**
- **PR #6 (Day 3)**, stacked on #5: events + registrations migration (`20261031000001_events.sql`), pgTAP 002 (18 tests), Explore / event detail / Create screens. Local: tsc ✅, lint ✅, jest 15/15 ✅, web export 13 routes ✅.
- The events migration is **NOT applied to edge-prod** yet. Apply it after #6's CI is green and it's merged.
- Party B `hemantooo` invited (write). CODEOWNERS updated in #5.
- Decisions: ADR-002 (no UI library) and ADR-009 (faculty domain = paruluniversity.ac.in, flexible ID codes, store accounts deferred, testing via web + APK + Expo Go).

## Next (in order)
1. **Party A:** merge PR #5 (squash). The website auto-deploys from `deploy.yml`, so check the Actions tab is green.
2. Rebase #6 on main: `git rebase --onto origin/main feat/T02-onboarding-deploy feat/T04-T05-events`, then force-push. Wait for CI, then Party A merges.
3. Apply `20261031000001_events.sql` to edge-prod (Supabase MCP `apply_migration`) and regenerate `src/lib/api/database.types.ts`.
4. Party A: make yourself super_admin once (SQL in PR #6), promote faculty with `set_role`, create a test event.
5. Run the **mobile-build** workflow, install the APK, and test on an iPhone with Expo Go (`npx expo start`).
6. Day 4: tickets (QR, offline) + Mode A scanner.

## Open questions
Real institute/course list (Party A collecting). Program codes beyond UG/PG (flexible for now).
