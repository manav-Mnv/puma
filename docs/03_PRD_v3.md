# Puma (EDGE): Product Requirements Document v3.0

*Every Node, Connected.* A Luma-style campus event platform for Parul University.

| Field | Value |
|---|---|
| Version | **3.0, final baseline for the 10-day MVP build** |
| Supersedes | PRD v2.0 (`docs/archive/`) |
| Owners | Party A (Manav, lead) · Party B (co-developer) |
| Technical companion | `04_SRS_v3.md` |
| Inputs | `01_ASSUMPTIONS_AUDIT.md`, `02_FACT_CHECK.md` |

> **Naming:** "Puma" is the repo and project codename. "EDGE" is the product brand from v2. **Decision needed from Party A:** keep EDGE as the user-facing name or rename it. All docs work either way.

---

## 1. Problem
Parul University runs events, clubs, attendance and certificates through WhatsApp groups, Google Forms, spreadsheets, paper sign-in sheets and hand-made certificates. Students miss events, organizers re-type attendance, and certificates arrive late or never. There is no trusted record of who organized what and who attended.

## 2. Vision
**Luma's ease, plus a university's trust layer.** Discovering, registering and checking in should feel as smooth as Luma. Every event carries a **verified badge** backed by the university hierarchy (Faculty, AD, Admin), and attendance automatically produces a **verifiable certificate**.

## 3. What changed from v2 (and why)
| v2 | v3 | Reason |
|---|---|---|
| Web first, React Native later (Phase 3) | **iOS + Android + Web from one Expo codebase, from Day 1** | The brief requires all 3 platforms ASAP. One codebase halves the work. |
| QStash queue + jitter for check-ins | Atomic database check-in | QStash free = ~1,000 msgs/day, which isn't enough and isn't needed |
| Vercel compute | Supabase Edge Functions + Cloudflare Pages | Vercel Hobby is non-commercial only. One fewer vendor. |
| S3 considered for storage | Supabase Storage → Cloudflare R2 | AWS free is now a 6-month credit plan |
| Domain check fails open | **Fails closed** with a clear error message | The check is local and can't time out |
| 4 people, no deadline | **2 people, 10 days**, with a solo fallback | The real team |
| Certificates stored as files | Rendered on demand + public verify link | Zero storage |
| DPDP consent in Phase 3 | **In the MVP** | It costs about an hour |
| Luma described as "web-first" | Luma has native apps | The v2 claim was wrong |

## 4. Goals and non-goals

**Goals (MVP, Day 10):**
1. A real student signs in with a Parul email, registers for an event, gets checked in, and **receives a correct certificate**, on web, Android and iPhone (PWA).
2. Faculty and ADs publish **verified** events with no approval wait.
3. Clubs can exist, and Club Leads can request events that an AD approves.
4. ₹0/month infrastructure.

**Non-goals (v1):** payments or ticket sales, external guests, gamification, multi-language (but no hard-coded strings), room booking, geofencing, rotating QR, Hubs, recurring events, co-hosting, Google Sheets live sync.

## 5. Users and roles
Data model supports: **Super Admin → Admin → AD → Club Lead / Faculty → Student**

| Role | MVP (Day 10) | Later |
|---|---|---|
| Student | Sign up (Parul email), onboarding, browse, register, ticket QR, self check-in, certificates | Interests feed, waitlists |
| Faculty | Create verified events, scan check-ins, mark complete | Club advisor |
| AD | Everything Faculty can do + **approve Club and Club-Lead events in their department** | SLA escalations dashboard |
| Club Lead | Request a club, request events (pending until AD approval), scan, mark complete | Analytics |
| Admin / Super Admin | **Seeded in the DB.** Uses the Supabase dashboard + a minimal admin screen (role assignment). | Full admin console, audit UI |

Club Leads **cannot remove members** (kept from v2). A "Report to AD" action is the recourse, shipped after the MVP.

## 6. Core user stories (MVP acceptance-ready)
- **S1. Student:** I sign in with Google using my Parul email, and with a non-Parul email I see a clear message explaining why I can't.
- **S2. Student:** I finish a short onboarding (name, enrollment, institute, course, year, phone) in under 60 seconds.
- **S3. Student:** I browse upcoming events (search + filter by date and department) and register in 1 tap.
- **S4. Student:** I see my ticket QR under "My Tickets", and it works without network once it has loaded.
- **S5. Organizer:** I scan a student's QR (Mode A), see ✅ + their name, and a second scan shows "Already checked in".
- **S6. Student:** At a big event, I scan the screen QR (Mode B) and I'm checked in within 3 seconds.
- **S7. Organizer:** I tap "Mark complete" and every checked-in student gets a certificate.
- **S8. Student:** I open, download or share my certificate, and anyone can verify it at a public link.
- **S9. Faculty / AD:** My events show a **Verified** badge immediately.
- **S10. Club Lead:** I request an event and can see whether it's *Pending*, *Approved* or *Rejected (with remarks)*.
- **S11. AD:** I see one queue of pending club and event requests in my department and approve or reject each in 1 tap with remarks.
- **S12. Organizer:** I download a CSV of registrations and attendance (flags unverified accounts) for the HOD.

## 7. Feature scope by release

| Release | Contents | Exit condition |
|---|---|---|
| **R1, Golden Path (Day 6)** | Auth + onboarding, event create (Faculty/AD), browse, register, ticket QR, Mode A scan, mark complete, certificate + verify page, CSV export, consent | One real student completes the loop on **web and Android**, and RLS is proven by tests |
| **R2, Pilot (Day 10)** | Clubs, Club Lead requests + AD approval, Mode B self check-in, push (Android + web), PWA install for iPhone, polish + accessibility | **Swift Coding Club** runs one real event end to end with no critical bug |
| **R3, Scale (after Day 10)** | Waitlists/capacity, invite-only, tags + recommended feed, feedback forms, admin console, audit UI, temp UG-number signup (Path B), iOS App Store (if $99 is approved), Sheets sync, offline manual attendance | Campus-wide rollout |
| **v2 (deferred)** | Payments, guests, Hubs, recurring, co-host, geofence, QR rotation, i18n Hindi/Gujarati, gamification | n/a |

## 8. Key product rules
- **Verification:** Faculty/AD events are auto-verified. Club Lead events are verified when approved. Approved clubs get a badge.
- **Approval SLA:** 2 days, then the request is marked *Overdue* (badge + Admin notified in R3).
- **Attendance:** one attendance record per registration, whichever mode or device. No minimum-duration threshold.
- **Completion:** done manually by the organizer, after the event starts. It triggers certificates. Adding a missed check-in after completion issues a single certificate (R2).
- **Certificates:** student name, event name/date, issuing club or department, signature line, **verification QR (from R1, because it's cheap)**.
- **Privacy:** Club Leads see academic fields only. Phone and personal email are visible to AD and above. Consent checkbox at signup. Data is kept while the account is active, with a 20-day deletion grace period.
- **Tone:** on-brand microcopy ("Connecting your node…", "Locking in your spot…").

## 9. Success metrics (pilot)
| Metric | Target for pilot |
|---|---|
| Golden-path completion (registered → certificate) with no support needed | ≥ 90% of attendees |
| Median time to check in (Mode B) | ≤ 3 s |
| Certificate delivered after "complete" | ≤ 60 s |
| Crash-free sessions | ≥ 99% |
| Pilot NPS / thumbs-up from Swift Coding Club | ≥ 70% positive |

## 10. Open product decisions
| # | Decision | Owner | Needed by |
|---|---|---|---|
| D1 | Brand name: EDGE or something new | Party A | Day 1 |
| D2 | Confirm the Parul student email domain(s) | Party A | **Day 0** |
| D3 | Institute/Course list (use a seeded subset + "Other" for MVP) | Party B | Day 2 |
| D4 | Will the university or a club pay $99 for Apple? | Party A | Day 7 (else PWA only) |
| D5 | AD deactivated with a pending queue → reassign to Admin (proposed default) | Party A | R3 |
| D6 | Glassmorphism visual direction: keep it light for low-end Android | Party B | Day 1 |

## 11. Risks
| Risk | Mitigation |
|---|---|
| Party B doesn't contribute | Lanes are separable. Checkpoints on Day 2 and Day 5 trigger the solo cut-list (see `05_EXECUTION_PLAN.md`). |
| Supabase pauses / no backups | GitHub Action keep-alive (daily) + weekly `pg_dump` to a private artifact |
| Unknown student email domain | Allow-list held in a DB config table. Editable without a deploy. |
| iPhone users can't install a native app | PWA with an install guide screen. Native app when Apple is funded. |
| Wi-Fi dead at the venue | Ticket QR is cached. Mode A scanner queues offline (R3). Mode B needs data. |
| 10 days is tight | Strict cut-list, AI agent pipeline, R1 locked before any R2 work |
