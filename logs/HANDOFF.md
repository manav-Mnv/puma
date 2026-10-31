# HANDOFF: resume point (overwrite at every stop)

**Updated:** 2026-10-15 · **By:** Claude (Manager) · **Phase:** Day 0 (mostly done) + Day 1 (in review)

## State
- Repo **public**. Ruleset `protect-main`: PR required (0 approvals until Party B joins, then raise it to 1), no force-push or deletion, linear history.
- Supabase `edge-prod` (ref `zhgjmecutkdwtswrdzhc`, Mumbai). 3 public secrets in GitHub. Local `.env` set.
- **PR #1** `feat/T01-day1-foundation`: Expo app (sign-in, session guard, tabs), identity migration (profiles + RLS + sign-up trigger for both paths + `complete_onboarding`), 20 pgTAP + 6 Jest tests, CI workflow.
  - Local: tsc ✅, lint ✅, jest 6/6 ✅, web export ✅, browser check (sign-in renders) ✅. pgTAP runs in CI (local Docker didn't start).
- The migration is **NOT yet applied to edge-prod**. Apply it only after the CI `db` job is green.

## Next (in order)
1. CI green on PR #1 → apply the migration to edge-prod (Supabase MCP `apply_migration`) → regenerate `src/lib/api/database.types.ts` → merge PR #1.
2. Add the required status checks (`app`, `db`) to the `protect-main` ruleset.
3. Party A (only you can do these): 3 private Supabase secrets (DB password, service-role, access token) · Google OAuth (docs/09 Part 3) · Cloudflare + Expo accounts · Party B's GitHub username · Drive: hemntomn → Viewer · Play Console + testers.
4. Day 2: onboarding screens (3 steps) + onboarding guard, web deploy pipeline (needs Cloudflare).

## Open questions
Faculty email domain · program codes besides UG/PG · real institute/course list (D3)
