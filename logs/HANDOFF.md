# HANDOFF: resume point (overwrite at every stop)

**Updated:** 2026-11-01 · **By:** Claude (Manager) · **Phase:** MVP + pre-pilot gaps closed → pilot

## State (main)
- **Students:** sign up (Parul email → Verified; enrollment no. or temp ID → Unverified), 3-step profile, Explore/register, Tickets (offline QR + code), self check-in from the projector QR (survives sign-in), certificates (PDF + public verify), Clubs, Inbox (+ 2h reminders), Get verified (Parul email link → temp ID becomes enrollment no.).
- **Staff:** "Faculty / Staff" onboarding (MIS ID + designation). Manage portal: create/edit/cancel events, scanner, projector QR, mark complete, CSV attendance, approval queue (AD/Admin), roles. Super Admin console.
- **Web** (PWA) auto-deploys from main: https://edge-parul.manavbarad978.workers.dev. **APK**: Actions → mobile-build (latest: expo.dev build 00728134…).
- **CI on every PR:** app (tsc, lint, Jest 36), db (pgTAP 001–009), e2e (Playwright golden path).

## Party A must do
1. **Run db-deploy.** It applies every migration after `certificates` (profile backfill, enrollment IDs, clubs/portal, self check-in/inbox, pre-pilot) to edge-prod.
2. Make yourself super_admin (SQL), then promote faculty/ADs in Manage → Roles.
3. Supabase Auth → Emails: free SMTP (Resend/Brevo) before the pilot.
4. Publish GitHub release v0.9.0. Drive: hemntomn → Viewer. Roll the Cloudflare token if the screenshot one was real.
5. Real institute/course list (D3).

## Next (backlog)
- Push to phones (Expo Push + FCM via `eas credentials`; the inbox is the source).
- AD department scoping (needs departments seeded).
- k6 load test for Mode B, Sentry wiring, accessibility pass, backup restore drill.
- Play Console closed testing (12 testers × 14 days), Apple when funded.
- Update `supabase/setup-cli` when a Node 24 release ships.
