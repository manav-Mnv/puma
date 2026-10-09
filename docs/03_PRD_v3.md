# HADGE: Product Requirements Document v3.1

*Every Node, Connected.* A Luma-style campus event platform for Parul University.

| Field | Value |
|---|---|
| Version | **3.1, final baseline for the 10-day MVP build** |
| Supersedes | PRD v3.0, PRD v2.0 (`docs/archive/`) |
| Owners | Party A (Manav, lead) · Party B (co-developer) |
| Technical companion | `04_SRS_v3.md` |
| Inputs | `01_ASSUMPTIONS_AUDIT.md`, `02_FACT_CHECK.md` |

> **Naming:** **HADGE** is the product name (confirmed 2026-10-10, "for now"). "Puma" stays as the repo and project codename.

### Changes in v3.1 (2026-10-10, decisions from Party A)
- Product name is **HADGE**.
- Student email domain confirmed: **`@paruluniversity.ac.in`**.
- **Both kinds of students are supported from Day 1:** those with a Parul email, and those with only a student ID (e.g. `25UG030303`). This used to be "Path B, Phase 2" and is now in the MVP.
- Student IDs: **UG, PG and other programs** are accepted (flexible format).
- **Every profile field is required** before registering for an event.
- Platform priority: **Website first, then Android (Play Store). iPhone App Store comes later from the same Expo codebase** (the university or a club will pay Apple's fee).
- Party B now owns **frontend + DevOps + some backend** (see `05_EXECUTION_PLAN.md`).

---

## 1. Problem
Parul University runs events, clubs, attendance and certificates through WhatsApp groups, Google Forms, spreadsheets, paper sign-in sheets and hand-made certificates. Students miss events, organizers re-type attendance, and certificates arrive late or never. There is no trusted record of who organized what and who attended.

## 2. Vision
**Luma's ease, plus a university's trust layer.** Discovering, registering and checking in should feel as smooth as Luma. Every event carries a **verified badge** backed by the university hierarchy (Faculty, AD, Admin), and attendance automatically produces a **verifiable certificate**.

## 3. What changed from v2 (and why)
| v2 | v3.1 | Reason |
|---|---|---|
| Web first, React Native later (Phase 3) | **One Expo codebase. Website + Android first, iPhone later from the same code.** | One codebase for every platform. No rewrite when the iPhone app comes. |
| QStash queue + jitter for check-ins | Atomic database check-in | QStash free ≈ 1,000 msgs/day, which isn't enough and isn't needed |
| Vercel compute | Supabase Edge Functions + Cloudflare Pages | Vercel Hobby is non-commercial only. One fewer vendor. |
| S3 considered for storage | Supabase Storage → Cloudflare R2 | AWS free is now a 6-month credit plan |
| Domain check fails open | **Two explicit sign-up paths** (Parul email = Verified, student ID = Unverified until linked) | No silent holes, and no student is locked out |
| Temp UG-number signup in Phase 2 | **In the MVP** | Many students (freshers) only have a student ID |
| 4 people, no deadline | **2 people, 10 days**, with a solo fallback | The real team |
| Certificates stored as files | Rendered on demand + public verify link | Zero storage |
| DPDP consent in Phase 3 | **In the MVP** | It costs about an hour |
| Luma described as "web-first" | Luma has native apps | The v2 claim was wrong |

## 4. Goals and non-goals

**Goals (MVP, Day 10):**
1. Any Parul student, **with a Parul email or with only a student ID**, creates a complete profile, registers for an event, gets checked in, and **receives a correct certificate**, on the **website** and the **Android app**.
2. Faculty and ADs publish **verified** events with no approval wait.
3. Clubs can exist, and Club Leads can request events that an AD approves.
4. ₹0/month infrastructure (one-off store fees are paid by the university or club).

**Non-goals (v1):** payments or ticket sales, external (non-Parul) guests, gamification, multi-language (but no hard-coded strings), room booking, geofencing, rotating QR, Hubs, recurring events, co-hosting, Google Sheets live sync.

## 5. Platforms and release order
| Order | Platform | How | When |
|---|---|---|---|
| 1 | **Website** (the main experience) | Expo web build on Cloudflare Pages, installable as a PWA | R1 (Day 6) |
| 2 | **Android app** | EAS build → APK on Day 6 → **Play closed testing** from Day 6 (pilot installs from the Play Store) → **public Play Store ≈ Day 20** (new personal accounts need 12 testers × 14 days first) | APK + closed test in R1/R2, public listing ≈ Day 20 |
| 3 | **iPhone app** | Same codebase → EAS iOS build → TestFlight → App Store, once Apple's $99/yr is paid | R3 (after Day 10). Until then iPhone users use the website/PWA. |

## 6. Identity: the two kinds of students

| | **Path A: Parul email student** | **Path B: Student-ID-only student** |
|---|---|---|
| Who | Has `name@paruluniversity.ac.in` | Has only a student ID, e.g. `25UG030303` (often freshers) |
| Sign up | Google Sign-In or email + password using the **Parul email** | Google Sign-In or email + password using a **personal email**, then **must enter a student ID** |
| Status | **Verified** ✅ immediately | **Unverified** until a Parul email is linked |
| Can do | Everything | **Everything**: register, attend, get certificates. "Unverified" only shows as a flag on organizer/HOD sheets. |
| Upgrade | n/a | Profile → "Link my Parul email" → confirmation email → becomes Verified, same account, history kept |

**Student ID format.** It reads as `YY` (year joined) + program letters + a unique number. For example, `25UG030303` is joined 2025, UG, number 030303. **UG, PG and other program codes are accepted**: 2 digits + 2–5 letters + 3–8 digits, stored uppercase. Each ID can belong to only one account. A duplicate shows "This ID is already registered, contact support". A confirmation step shows the ID back to the student before submitting.

**Faculty, AD and admins** must use a Parul email.

## 7. Student profile (all required before registering)
| Field | Notes |
|---|---|
| Full name | Pre-filled from Google, editable |
| Parul email | Path A: from sign-in, locked. Path B: empty until linked. |
| Personal email | Path B: from sign-in. Path A: entered. |
| Enrollment / student ID | Required for everyone. Format-checked and unique. |
| Institute | Dropdown (seeded list + "Other") |
| Course / program | Dropdown (+ "Other") |
| Year + semester | Dropdown |
| Mobile number | Required, no OTP. Visible only to AD/Admin. |
| Gender | Required, with options incl. **"Prefer not to say"** |
| Residence | Hosteller / Day scholar |
| Consent | "I agree to the Terms & Privacy Policy" (DPDP Act 2023) |
| Photo | Optional, from Google if present |

Onboarding is **3 short screens**: Basics → Academic → Contact & consent. Target: under 90 s.

## 8. Users and roles
Data model supports: **Super Admin → Admin → AD → Club Lead / Faculty → Student**

| Role | MVP (Day 10) | Later |
|---|---|---|
| Student (both paths) | Sign up, profile, browse, register, ticket QR, self check-in, certificates, link Parul email | Interests feed, waitlists |
| Faculty | Create verified events, scan check-ins, mark complete | Club advisor |
| AD | Everything Faculty can do + **approve Club and Club-Lead events in their department** | SLA escalations dashboard |
| Club Lead | Request a club, request events (pending until AD approval), scan, mark complete | Analytics |
| Admin / Super Admin | **Seeded in the DB.** Minimal admin screen (assign roles, view flagged accounts). | Full admin console, audit UI |

Club Leads **cannot remove members** (kept from v2). "Report to AD" comes after the MVP.

## 9. Core user stories (MVP)
- **S1. Student (Parul email):** I sign in with Google using my Parul email and I'm Verified straight away.
- **S1b. Student (ID only):** I sign in with my personal Google/email, enter my student ID (e.g. 25UG030303), and can use everything. My account shows "Unverified" until I link my Parul email.
- **S1c. Student (ID only):** When I get my Parul email, I link it in my profile and become Verified, keeping all my registrations and certificates.
- **S2. Student:** I complete every profile field in 3 short screens before my first registration.
- **S3. Student:** I browse upcoming events (search + filter by date and department) and register in 1 tap.
- **S4. Student:** I see my ticket QR under "My Tickets", and it works without network once it has loaded.
- **S5. Organizer:** I scan a student's QR (Mode A), see ✅ + their name (+ an "Unverified" tag if relevant), and a second scan shows "Already checked in".
- **S6. Student:** At a big event, I scan the screen QR (Mode B) and I'm checked in within 3 seconds.
- **S7. Organizer:** I tap "Mark complete" and every checked-in student gets a certificate.
- **S8. Student:** I open, download or share my certificate, and anyone can verify it at a public link.
- **S9. Faculty / AD:** My events show a **Verified** badge immediately.
- **S10. Club Lead:** I request an event and can see whether it's *Pending*, *Approved* or *Rejected (with remarks)*.
- **S11. AD:** I see one queue of pending club and event requests in my department and approve or reject each in 1 tap with remarks.
- **S12. Organizer:** I download a CSV of registrations and attendance (with the Verified/Unverified column) for the HOD.

## 10. Feature scope by release

| Release | Contents | Exit condition |
|---|---|---|
| **R1, Golden Path (Day 6)** | **Both sign-up paths** + full profile + consent, event create (Faculty/AD), browse, register, ticket QR, Mode A scan, mark complete, certificate + verify page, CSV export. **Website live + Android APK.** | One Parul-email student **and** one ID-only student each complete the loop on the website and Android, and RLS is proven by tests |
| **R2, Pilot (Day 10)** | Clubs, Club Lead requests + AD approval, Mode B self check-in, push (Android + web), link-Parul-email flow, **Play closed testing with 15–20 club testers** (public listing ≈ Day 20), polish + accessibility | **Swift Coding Club** runs one real event end to end with no critical bug |
| **R3, Scale (after Day 10)** | **iPhone App Store build**, waitlists/capacity, invite-only, tags + recommended feed, feedback forms, admin console + flagged-account review, audit UI, Sheets sync, offline manual attendance | Campus-wide rollout |
| **v2 (deferred)** | Payments, guests, Hubs, recurring, co-host, geofence, QR rotation, i18n Hindi/Gujarati, gamification | n/a |

## 11. Key product rules
- **Verification:** Faculty/AD events are auto-verified. Club Lead events are verified when approved. Approved clubs get a badge. Student "Verified" means a Parul email is linked.
- **Approval SLA:** 2 days, then the request is marked *Overdue*.
- **Attendance:** one attendance record per registration, whichever mode or device. No minimum-duration threshold. Unverified students are flagged, never blocked.
- **Completion:** done manually by the organizer. It triggers certificates. Adding a missed check-in after completion issues a single certificate (R2).
- **Certificates:** student name, student ID, event name/date, issuing club or department, signature line, **verification QR**.
- **Privacy:** Club Leads see academic fields only. Phone, gender and personal email are visible to AD and above. Consent at signup. Data is kept while the account is active, with a 20-day deletion grace period.
- **Tone:** on-brand microcopy ("Connecting your node…", "Locking in your spot…").

## 12. Success metrics (pilot)
| Metric | Target for pilot |
|---|---|
| Golden-path completion (registered → certificate) with no support needed | ≥ 90% of attendees |
| Profile completion time (median) | ≤ 90 s |
| Median time to check in (Mode B) | ≤ 3 s |
| Certificate delivered after "complete" | ≤ 60 s |
| Crash-free sessions | ≥ 99% |
| Positive feedback from Swift Coding Club | ≥ 70% |

## 13. Decisions
| # | Decision | Status |
|---|---|---|
| D1 | Brand name | ✅ **HADGE** (for now) |
| D2 | Student email domain | ✅ **paruluniversity.ac.in** |
| D2b | ID-only students | ✅ Personal email/Google + student ID, Unverified until linked |
| D2c | ID formats | ✅ UG + PG + others: `^[0-9]{2}[A-Z]{2,5}[0-9]{3,8}$` (tighten once the college confirms program codes) |
| D3 | Institute/Course list | ⏳ Party B to collect by Day 2 (seed a subset + "Other") |
| D4 | Apple $99/yr | ✅ University/club will pay. iPhone app in R3. |
| D4b | Google Play $25 one-time | ⏳ Sponsor to pay **on Day 0–1** (closed testing must start by Day 6) |
| D9 | Private repo needs GitHub Pro for branch protection | ⏳ Apply for the free Student Developer Pack (or make the repo public) |
| D5 | AD deactivated with a pending queue → reassign to Admin | Proposed default, R3 |
| D6 | Glassmorphism kept light for low-end Android | Party B, Day 1 |
| D7 | Framework | ✅ **Expo / React Native, one codebase** |
| D8 | Do faculty use the same `@paruluniversity.ac.in` domain? | ⏳ Party A to confirm (Day 0) |

## 14. Risks
| Risk | Mitigation |
|---|---|
| Someone signs up with a fake or someone else's student ID | IDs are unique; "Unverified" flag on every sheet; organizer sees the tag at scan; admin can reset an ID; linking a Parul email fixes it permanently |
| Party B doesn't contribute | Lanes are separable. Checkpoints on Day 2 and Day 5 trigger the solo cut-list. |
| Supabase pauses / no backups | GitHub Action keep-alive (daily) + weekly `pg_dump` |
| Play Store 12-tester / 14-day rule (personal account) | Closed test from Day 6 with 15–20 club testers. Public listing ≈ Day 20. APK link works meanwhile. |
| Wi-Fi dead at the venue | Ticket QR is cached. Mode A scanner queues offline (R3). |
| 10 days is tight | Strict cut-list, AI agent pipeline, R1 locked before any R2 work |
