# DECISIONS (ADRs)

| ID | Date | Decision | Status |
|---|---|---|---|
| ADR-001 | 2026-10-09 | Use one Expo codebase for iOS/Android/Web, Supabase backend, an atomic RPC for check-in (no QStash), Cloudflare Pages hosting, Supabase Storage → R2 (no AWS S3), certificates rendered on demand, domain check fails closed | Accepted (pending Party A sign-off) |
| ADR-002 | 2026-10-31 | No Figma file exists, so no UI library: plain React Native `StyleSheet` with theme tokens in `src/constants/theme.ts` and a small in-repo kit (`src/components`). Zero extra dependencies. Revisit if a design system arrives. | Accepted |
| ADR-003 | 2026-10-15 | Product name **EDGE** (corrected from "HADGE", a voice-typing error). Slugs: `edge-prod` (Supabase), `edge-parul` (Pages/Expo), app scheme `edgepu://` (`edge://` is reserved by the Microsoft Edge browser). Repo codename stays Puma. | Accepted |
| ADR-004 | 2026-10-10 | Student domain **paruluniversity.ac.in**. **Two identity paths in the MVP:** Parul email → Verified; personal email/Google + student ID (`^[0-9]{2}[A-Z]{2,5}[0-9]{3,8}$`, UG/PG/other, unique) → Unverified until a Parul email is linked. Replaces the "fail closed / domain-only" rule from ADR-001. | Accepted |
| ADR-005 | 2026-10-10 | All profile fields required before registering (ID, institute, course, year/sem, phone, gender incl. "prefer not to say", residence, personal email, consent) | Accepted |
| ADR-006 | 2026-10-10 | Platform order: website → Android/Play Store → iPhone App Store (R3, sponsor pays Apple). Framework locked: Expo, one codebase. | Accepted |
| ADR-008 | 2026-10-10 | Setup facts: Supabase CLI per project (`npx supabase`), not a global npm install. Private repo → get GitHub Pro via the Student Pack (or go public) for branch protection. The prod DB deploy is a manual `workflow_dispatch` that only Party A can run (no Environment reviewers on our plan). Play personal account → closed test 12+ testers × 14 days → public ≈ Day 20. | Accepted |
| ADR-007 | 2026-10-10 | Lane split: Party B = frontend owner + DevOps + backend services (Edge Functions, seeds, storage). Party A = core schema/RLS/auth/RPCs + agent manager. | Accepted |

---

## ADR-001: Free universal stack
**Context:** 10 days, 2 developers, ₹0/month, all three platforms. The v2 plan built web first and mobile later, relied on QStash (~1k msgs/day free) and Vercel Hobby (non-commercial), and considered AWS S3 (now a 6-month credit plan for new accounts).
**Decision:** see the table above. Details in docs/02 §2 and docs/04 §1.
**Consequences:** one UI codebase, fewer vendors, no message caps. iPhone native distribution needs the Apple $99/yr; until then iPhone users get the PWA. Revisit the check-in design only if the k6 test fails.

<!-- Template
## ADR-00X: Title
**Context:** … **Decision:** … **Consequences:** … **Status:** Proposed | Accepted | Superseded
-->

## ADR-009 (2026-10-31): Party A answers + rollout focus
- Faculty, AD and admins use the same domain, `paruluniversity.ac.in` (D8 resolved).
- Student ID program codes: unknown beyond UG/PG, so keep the flexible pattern `^[0-9]{2}[A-Z]{2,5}[0-9]{3,8}$` (D2c).
- Institute/course list: Party A is collecting it. The placeholder list stays until then (D3).
- Party B = GitHub `hemantooo` (invited, write access).
- Store accounts (Play Console, Apple) are **deferred**. Testing now goes through: website (Cloudflare Workers), Android **APK** built by EAS (`mobile-build` workflow), iPhone through **Expo Go** on a real device. An iOS *simulator* needs macOS, which the team doesn't have.
- Website hosting is a Cloudflare **Worker with static assets** (`wrangler.jsonc`), not Pages. Same free tier, URL `edge-parul.manavbarad978.workers.dev`.
