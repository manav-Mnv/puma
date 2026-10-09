# DECISIONS (ADRs)

| ID | Date | Decision | Status |
|---|---|---|---|
| ADR-001 | 2026-10-09 | Use one Expo codebase for iOS/Android/Web, Supabase backend, an atomic RPC for check-in (no QStash), Cloudflare Pages hosting, Supabase Storage → R2 (no AWS S3), certificates rendered on demand, domain check fails closed | Accepted (pending Party A sign-off) |
| ADR-002 | — | UI library: NativeWind vs Tamagui | Pending (Party B, Day 0) |

---

## ADR-001: Free universal stack
**Context:** 10 days, 2 developers, ₹0/month, all three platforms. The v2 plan built web first and mobile later, relied on QStash (~1k msgs/day free) and Vercel Hobby (non-commercial), and considered AWS S3 (now a 6-month credit plan for new accounts).
**Decision:** see the table above. Details in docs/02 §2 and docs/04 §1.
**Consequences:** one UI codebase, fewer vendors, no message caps. iPhone native distribution needs the Apple $99/yr; until then iPhone users get the PWA. Revisit the check-in design only if the k6 test fails.

<!-- Template
## ADR-00X: Title
**Context:** … **Decision:** … **Consequences:** … **Status:** Proposed | Accepted | Superseded
-->
