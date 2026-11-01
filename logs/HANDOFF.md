# HANDOFF: resume point (overwrite at every stop)

**Updated:** 2026-11-01 · **By:** Claude (Manager) · **Phase:** Day 6 nearly done → R1 release pending Party A checks

## State
- **main**: Days 1–5 plus the golden-path E2E (#10). CI runs app + db + **e2e** (Playwright against local Supabase) on every PR, and all are green.
- Live web deploys from main automatically (Cloudflare Worker `edge-parul`, Wrangler 4 + Workers token).
- edge-prod migrations: identity, events, checkin, certificates. **Pending:** `20261101000003_profile_backfill` (from #11). It fixes the blank screen: the 2 Google accounts created before the identity migration had no profile.
- #12 (actions v5, `preview_urls: false`) is set to auto-merge.

## Next (in order)
1. **Party A: run db-deploy** (Actions → db-deploy → Run workflow) to apply the profile backfill. Then sign in on the live site: you should land on onboarding (or the tabs) instead of a blank page.
2. Party A: make yourself super_admin (SQL in Supabase), then run the live flow once on a phone (Expo Go) and the web.
3. Tag **v0.1.0** (R1) when step 2 passes. Run **mobile-build** for the Android APK.
4. Day 7 (R2): Clubs + Club Lead event requests + AD approval queue. Also: faculty/AD onboarding (MIS ID, designation) instead of the student form.

## Open questions
Real institute/course list. Program codes beyond UG/PG.
