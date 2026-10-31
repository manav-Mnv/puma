# HANDOFF: resume point (overwrite at every stop)

**Updated:** 2026-10-31 · **By:** Antigravity (Manager) · **Phase:** Day 1 COMPLETE (Merged to `main`) → Day 2 Ready

## State
- Repo **public** (`manav-Mnv/puma`). Ruleset `protect-main`: PR required (0 approvals until Party B joins), no force-push, linear history, required status checks (`app`, `db`) active.
- Supabase `edge-prod` (ref `zhgjmecutkdwtswrdzhc`, Mumbai):
  - Identity migration applied (`profiles`, `allowed_email_domains`, `institutes`, `departments` with full RLS, triggers, `complete_onboarding` RPC, and initial institute seed data).
  - TypeScript types (`src/lib/api/database.types.ts`) generated directly from `edge-prod`.
  - Google OAuth connected with authorized redirect callback.
  - Redirect URLs configured (`http://localhost:8081/**`, `https://edge-parul.manavbarad978.workers.dev/**`, `edgepu://**`).
- All 9 GitHub Secrets configured: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `EXPO_TOKEN`.
- Web app live: deployed at `https://edge-parul.manavbarad978.workers.dev/`.
- Local `.env` cleaned (public keys only).
- **PR #2 MERGED to `main`**: Expo SDK 57 skeleton, sign-in screen, session guard, tabs, pgTAP + Jest tests (all passing).

## Next (in order)
1. **Day 2 kickoff**: 3-step onboarding UI (`/onboarding`), onboarding guard (redirect users with incomplete profile), and Cloudflare automated deployment workflow (`deploy.yml`).
2. Party A actions when ready:
   - Provide Party B's GitHub username to add collaborator.
   - Adjust Google Drive permissions for `hemntomn@gmail.com` (Editor → Viewer).
   - Set up Google Play Console ($25) and collect 15–20 tester emails for the 14-day closed testing track.

## Open questions
- Faculty email domain (confirm if different from `@paruluniversity.ac.in`).
- Other student program codes (besides UG and PG).
- Real institute/course list for Day 3 seed data.
