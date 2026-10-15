# HANDOFF: resume point (overwrite at every stop)

**Updated:** 2026-10-15 · **By:** Claude · **Phase:** Day 0 (in progress)

## State
- Product name corrected to **EDGE** everywhere (repo + Drive). ADR-003 updated. Slugs: `edge-prod`, `edge-parul`, scheme `edgepu://`.
- Calendar re-baselined: Day 1 = 16 Oct, R1 = 21 Oct, pilot = 25 Oct (docs/05).
- ✅ Supabase `edge-prod` created (ref `zhgjmecutkdwtswrdzhc`, Mumbai, org "swift coding club", $0). GitHub secrets set: SUPABASE_PROJECT_REF, EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY (publishable key). `.env.example` committed, local `.env` created (git-ignored).
- ⚠️ Both free Supabase slots are now used, so there is no spare for an emergency restore.
- No app code yet. No GitHub secrets. Party B not added.

## Next (in order)
1. **Party A (Supabase dashboard, secrets only you can copy):** Settings → Database → reset/copy the DB password → secret SUPABASE_DB_PASSWORD · Settings → API Keys → secret key → SUPABASE_SERVICE_ROLE_KEY · Account → Access Tokens → SUPABASE_ACCESS_TOKEN. Then Auth → Providers: Email on + Confirm email; Google (after docs/09 Part 3).
2. Party A: decide whether the repo goes public, or apply for the Student Developer Pack.
3. Party A: add Party B to GitHub (send their username), and make the Drive folder view-only (hemntomn → Viewer).
4. Party A: Play Console ($25 sponsor) + 15–20 tester emails.
5. Both: docs/09_SETUP_GUIDE.md Parts 1, 3–8 (Google OAuth, Cloudflare, Expo, Sentry, secrets).
6. Answer: faculty email domain? Program codes besides UG/PG?
7. Then: "Act as Manager per CLAUDE.md. Day 0 is done. Start Day 1 per docs/05."

## Resume command
Paste the "kick-off" message from docs/06_SYSTEM_PROMPTS.md into Claude Code at the repo root.
