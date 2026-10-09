# TASKS: board

Columns: **Backlog → Ready → In progress → Review → Verified → Done**. Lane: A = Party A, B = Party B (A takes over in solo mode).

| ID | Lane | Task | Release | Status | Acceptance criteria (short) |
|---|---|---|---|---|---|
| D0-1 | A | Confirm email domain + pricing re-check | Setup | Ready | Domain(s) recorded in DECISIONS |
| D0-2 | A | Accounts + secrets (Supabase, CF Pages, Expo, Sentry) | Setup | Ready | `.env.example` committed, secrets in GitHub |
| D0-3 | A | Add Party B, branch protection | Setup | Ready | B opens a test PR, CI required |
| D0-4 | B | Figma check + ADR-002 UI library | Setup | Ready | ADR-002 Accepted |
| D0-5 | A+B | Load system prompts | Setup | Ready | Kick-off prompt answers correctly |
| T01 | A | Domain-restricted sign-in (fail closed) | R1 | Backlog | Non-Parul email rejected with a clear message. Parul email → profile row. |
| T02 | A+B | Onboarding + consent | R1 | Backlog | 3 steps, < 60 s, consent_at stored |
| T03 | A | RLS baseline + CI RLS check | R1 | Backlog | CI fails if any table lacks RLS. Role tests pass. |
| T04 | A+B | Create event (Faculty/AD → verified) | R1 | Backlog | Badge shown. Student cannot create. |
| T05 | A+B | Browse/search + register | R1 | Backlog | 1-tap register, idempotent |
| T06 | B | Ticket QR, offline cache | R1 | Backlog | QR shows in airplane mode after first load |
| T07 | A+B | Mode A scan | R1 | Backlog | ✅ name. Second scan says "already". Wrong event rejected. |
| T08 | A | Complete → certificates | R1 | Backlog | One cert per attendee. Second complete makes no duplicates. |
| T09 | B | Certificate view/PDF + /verify page | R1 | Backlog | PDF on web + Android. Verify page shows minimal data. |
| T10 | A | CSV export | R1 | Backlog | Organizer/AD only. Unverified flag column. |
| T16 | A | Keep-alive + weekly backup Actions | R1 | Backlog | Both workflows green. Restore drill done. |
| T11 | A+B | Clubs + Club Lead event requests | R2 | Backlog | Request → pending with status chip |
| T12 | A+B | AD approval queue | R2 | Backlog | Approve/reject with remarks. Event becomes verified. |
| T13 | A+B | Mode B self check-in + k6 | R2 | Backlog | p95 < 1.5 s @ 1,000/60 s, 0 duplicates |
| T14 | A+B | Push + in-app inbox | R2 | Backlog | Android + PWA receive. Critical can't be muted. |
| T15 | B | PWA install guide + APK release | R2 | Backlog | iPhone install works. APK link live. |
