# HANDOFF: resume point (overwrite at every stop)

**Updated:** 2026-11-01 · **By:** Claude (Manager) · **Phase:** MVP feature-complete (Days 1–10) → pilot prep

## State (main)
- **Students:** sign-up (Parul email → Verified; enrollment no. or temporary ID → Unverified), 3-step profile, Explore + register, Tickets (offline QR + code), Mode B self check-in, certificates (PDF + public verify), Clubs (join/leave/request), Inbox, Get verified (link Parul email → temp ID replaced by enrollment no.).
- **Manage portal** (`/manage`) for Faculty / Club Lead / AD / Admin: create event, my events (status + remarks), scanner (Mode A), projector QR (Mode B), mark complete, approval queue (AD/Admin, 2-day overdue), roles. **Super Admin console** (`/super`): platform stats; only Super Admin creates Admins.
- **Web:** installable PWA (manifest, Add to Home Screen guide). Live at https://edge-parul.manavbarad978.workers.dev (auto-deploys from main).
- **CI on every PR:** app (tsc, lint, Jest 33), db (pgTAP 001–008), e2e (Playwright golden path). Workflows: deploy, db-deploy (manual, Party A), backup (weekly, encrypted), keepalive (daily), mobile-build (APK).
- **APK:** first EAS build started 2026-11-01 (Actions → mobile-build, run 41280498341). The download link is in the run summary / expo.dev.

## Party A must do
1. **Run db-deploy.** It applies migrations 0003 (profile backfill), 0004 (enrollment nos.), 0005/clubs portal, and 0006 self check-in + inbox to edge-prod. Until then the live site lacks those features.
2. Make yourself super_admin: `update public.profiles set role='super_admin' where parul_email='…';`
3. Supabase Auth → Emails: add a free SMTP sender (Resend/Brevo) before the pilot. The built-in sender is rate-limited, and Get verified sends confirmation emails.
4. Pilot with Swift Coding Club; collect feedback.

## Next (post-MVP backlog)
- Push to phones (Expo Push + FCM credentials via `eas credentials`; the inbox is already the source).
- Faculty/AD onboarding fields (MIS ID, designation) instead of the student form.
- AD department scoping (departments table is empty), real institute/course list (D3).
- Self check-in for signed-out scanners (keep the deep link through sign-in).
- CSV export (T10), k6 load test for Mode B (T13), iOS App Store (R3).
