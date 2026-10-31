# TASKS: board (v3.1)

Columns: **Backlog → Ready → In progress → Review → Verified → Done**. Lane: A = Party A (core backend), B = Party B (frontend + DevOps + backend services). A takes over B in solo mode.

| ID | Lane | Task | Release | Status | Acceptance criteria (short) |
|---|---|---|---|---|---|
| D0-1 | A | Confirm faculty domain + pricing re-check | Setup | Ready | Student domain ✅ paruluniversity.ac.in. Faculty domain recorded. |
| D0-2 | B | Accounts + secrets (Supabase, CF Pages, Expo, Sentry) | Setup | Done | `.env.example` committed, 9 secrets in GitHub, Cloudflare + Expo + Supabase set up |
| D0-3 | A | Add Party B + apply for the Student Developer Pack (GitHub Pro) or make the repo public + branch protection | Setup | Partly done (repo public, `protect-main` active with status checks; Party B not added) | B opens a test PR. Protection on once Pro is active. |
| D0-4 | B | Figma check + ADR-002 UI library | Setup | Ready | ADR-002 Accepted |
| D0-5 | A+B | Load system prompts | Setup | Ready | Kick-off prompt answers correctly |
| D0-6 | A | Google Play: sponsor pays, account created + ID verified, 15–20 tester emails | Setup | Ready | Account verified by Day 5 |
| D0-7 | A+B | Follow docs/09_SETUP_GUIDE.md Parts 1–10 | Setup | In progress (Parts 1–5 done) | Part 10 final check all ticked |
| T01 | A | Sign-in, both paths (Parul email → Verified, personal email + ID → Unverified) | R1 | Done (PR #2 merged) | Both paths work with Google and email/password. Status correct. |
| T02 | A | Full required profile (3 screens) + consent + student-ID validation/uniqueness | R1 | In progress (RPC in PR #2, screens Day 2) | Can't register until complete. `25UG030303` accepted, bad format rejected, duplicate blocked. |
| T03 | A | RLS baseline + RLS tests | R1 | Done (PR #2 merged) | Role tests pass |
| T03b | B | CI pipeline + RLS-enabled check + web preview deploys | R1 | Done (PR #2 merged, checks required in ruleset) | CI < 10 min. Fails if any table lacks RLS. PR preview URL posted. |
| T04 | A+B | Create event (Faculty/AD → verified) | R1 | Backlog | Badge shown. Student cannot create. |
| T05 | A+B | Browse/search + register | R1 | Backlog | 1-tap register, idempotent, needs complete profile |
| T06 | B | Ticket QR, offline cache | R1 | Backlog | QR shows in airplane mode after first load |
| T07 | A+B | Mode A scan (RPC A, UI B) | R1 | Backlog | ✅ name + Unverified tag. Second scan says "already". Wrong event rejected. |
| T08 | A | Complete → certificates | R1 | Backlog | One cert per attendee. Second complete makes no duplicates. |
| T09 | B | Certificate view/PDF + /verify page | R1 | Backlog | PDF on web + Android. Verify page shows minimal data. |
| T10 | B | CSV export Edge Function + button | R1 | Backlog | Organizer/AD only. Verified/Unverified column. |
| T16 | B | Keep-alive + weekly backup Actions | R1 | Backlog | Both workflows green. Restore drill done (Day 9). |
| T18 | B | Seed institutes / courses / departments | R1 | In progress (placeholder list in PR #1, real list = D3) | Dropdowns populated, plus "Other" |
| T19 | B | Release R1: website prod + Android APK + Sentry | R1 | Backlog | Prod URL + APK link live |
| T11 | A+B | Clubs + Club Lead event requests | R2 | Backlog | Request → pending with status chip |
| T12 | A+B | AD approval queue | R2 | Backlog | Approve/reject with remarks. Event becomes verified. |
| T13 | A+B | Mode B self check-in (RPC A, UI B) + k6 (B) | R2 | Backlog | p95 < 1.5 s @ 1,000/60 s, 0 duplicates |
| T14 | B | Push Edge Function + reminder cron + in-app inbox | R2 | Backlog | Android + web receive. Critical can't be muted. |
| T15 | B | Play closed testing (Day 6) → production application (≈ Day 20) + PWA install guide | R2 | Backlog | 15–20 testers opted in, pilot installs from Play. Production applied for after 14 days. |
| T17 | A | Link Parul email → Verified | R2 | Backlog | Same account, history kept. Duplicate Parul email refused. |
| R3-iOS | B (A in solo) | iPhone: Apple enrollment → EAS iOS → TestFlight → App Store | R3 | Backlog | App approved |
