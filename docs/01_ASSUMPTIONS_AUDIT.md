# Level 1: Assumptions Audit

**Project:** Puma (codename), a Luma-style campus event platform for **Parul University**. The v2.0 docs call the product **EDGE**.
**Inputs reviewed:** `docs/archive/EDGE_PRD_v2.0.md` and `docs/archive/EDGE_SRS_v2.0.md`
**Date:** 2026-10-09
**Method:** I pulled out every claim the two documents make or quietly assume. Each one is labelled:

- ✅ **Holds**: true, or a sound decision
- ⚠️ **Shaky**: partly true, out of date, or risky
- ❌ **False / conflicts**: wrong, or conflicts with the brief (10 days, free, iOS + Android + web, 2 people)

Level 2 (`02_FACT_CHECK.md`) checks each ⚠️ and ❌ item against sources. Level 3 (`03_PRD_v3.md` and `04_SRS_v3.md`) contains the corrected plan.

---

## A. Product and scope assumptions

| # | Assumption in v2.0 | Verdict | Why |
|---|---|---|---|
| A1 | The problem is real: events, clubs, attendance and certificates currently run on spreadsheets, WhatsApp and paper | ✅ | This is plausible and typical for Indian universities. It is the core value. |
| A2 | "Luma was confirmed to be web-first/PWA, not native-app-first" | ❌ | Luma ships **native iOS and Android apps** ("Luma: Events & Invites"). The iOS app is the full experience. The web-first decision can still stand, but it can't rest on this claim. |
| A3 | The golden path (sign in → register → scanned → certificate) comes first | ✅ | Correct. It is the best idea in either document. |
| A4 | Web first, and mobile starts only after the pilot (Phase 3) | ❌ (vs the brief) | The brief needs iOS, Android and web **as soon as possible**. Building a Next.js web app and then a separate React Native app means building the UI twice. One Expo codebase covers all three. |
| A5 | 4-person team (Design, Backend ×2, Product) | ❌ (vs reality) | The real team is **2 developers (Party A + Party B)**, and Party B may not contribute. |
| A6 | Timeline "ASAP, no fixed date" | ❌ (vs the brief) | The target is **about 10 days**, so scope has to be cut hard. |
| A7 | A 5-tier role hierarchy (Super Admin → Admin → AD → Club Lead/Faculty → Student) | ⚠️ | It is right for the long term but too much for 10 days. The data model should support it from Day 1 while the UI ships only 3 of the tiers. |
| A8 | Hubs and the "Director" label | ⚠️ | This is speculative. Park it in v2. |
| A9 | 30,000 users at full rollout on a free stack | ⚠️ | This works for auth (50k MAU free). Database size is fine. Bandwidth and images are the real limits (see Level 2). |
| A10 | No success numbers defined | ⚠️ | Tolerable for a pilot. Three cheap metrics are proposed in v3. |

## B. Technical assumptions

| # | Assumption in v2.0 | Verdict | Why |
|---|---|---|---|
| B1 | Supabase (Postgres + Auth + RLS) as the core | ✅ | This is the right choice. RLS maps well onto the role matrix. |
| B2 | Firestore was dropped because of the 50k reads / 20k writes per day cap | ✅ | That cap is real on Spark. The reasoning holds. |
| B3 | FCM is free and has no cap | ✅ (mostly) | FCM costs nothing on any plan. **However, iOS push needs APNs, and APNs needs a paid Apple Developer account.** |
| B4 | Vercel serverless for compute | ⚠️ | The Hobby plan is **non-commercial only** and has hard caps. It isn't needed anyway, because Supabase Edge Functions plus Postgres functions cover compute. |
| B5 | Upstash QStash queue for 800–1,000 concurrent check-ins | ❌ | The free plan is **about 1,000 messages/day**, and every retry counts. One big event would use up the day. It is also unnecessary: one idempotent Postgres function with a `UNIQUE` constraint handles concurrent check-ins atomically, with no queue. |
| B6 | Adaptive "jitter" queue that resolves in 3–6 s at 1,000+ concurrent | ❌ | This is over-engineered for a 10-day MVP. Replace it with an atomic RPC and optimistic UI. |
| B7 | Google Sheets and Drive sync through a service account | ⚠️ | It works, but it isn't on the golden path. A **CSV export button** gives 90% of the value at 5% of the cost. |
| B8 | Domain check "fails open" when verification times out | ❌ (logic) | The check is a string comparison on the email domain inside Postgres, so it can't time out. Failing open only adds a hole. **Fail closed** with a clear error message instead. |
| B9 | `api/verify-domain.js` needs a rewrite for Supabase | ✅ → replaced | A Postgres trigger or auth hook on sign-up replaces it entirely. |
| B10 | No phone OTP because SMS costs money | ✅ | Correct. Keep it. |
| B11 | Supabase free has no automated backups | ✅ | Treat the free tier as having **no backups**. A free GitHub Actions `pg_dump` job fixes this. |
| B12 | (Not stated) Supabase free projects stay online | ❌ | **Free projects pause after 7 days without DB activity.** You need a keep-alive cron, which is free on GitHub Actions. |
| B13 | (Not stated) New tables are reachable through the Data API automatically | ❌ | From **2026-05-30, new projects** need explicit `GRANT`s, and all existing projects follow on **2026-10-30**. Every migration has to include grants. |
| B14 | Amazon S3 "free for a while" for storage (from the brief) | ❌ | AWS accounts created after **2025-07-15** get a credit-based Free Plan (about $100–200, **6 months**). After that the account must upgrade or it closes and resources are deleted. That is not a durable free option. Use **Cloudflare R2** (10 GB free forever, S3-compatible, zero egress) or **Supabase Storage** (1 GB). |
| B15 | Certificates as stored files | ⚠️ | Storing a PDF per student wastes storage. Store a **certificate record** and render the PDF on demand, on the client or an edge function. Storage cost drops to zero. |
| B16 | React Native for mobile | ✅ → refined | Use **Expo (React Native + Expo Router)**. One codebase builds iOS, Android **and web**. |
| B17 | Minimum OS iOS 16+ and Android 10+ | ✅ | These are reasonable. iOS 16.4+ also supports web push for installed PWAs. |
| B18 | "Free" includes iPhone distribution | ❌ | The **App Store needs the Apple Developer Program (~$99/yr)**. The free route to iPhone is the **PWA** (Add to Home Screen) plus Expo Go for internal testing. Google Play costs **$25 one-time**. Android APK sideloading is free. |

## C. Process and document assumptions

| # | Assumption | Verdict | Why |
|---|---|---|---|
| C1 | The PRD and SRS are consistent | ⚠️ | They are mostly consistent, but phase tags were patched several times (see their revision history), and Hubs and the QStash risk were left open. |
| C2 | The repo `manav-Mnv/edge-web` and the URL `edgeweb.vercel.app` exist | ⚠️ | These aren't verified here. The new repo is `manav-Mnv/puma`. |
| C3 | The Figma design system exists (glassmorphism, 6 pages) | ⚠️ | Not verified. Party B or the Designer agent should confirm it. Glassmorphism performs badly on low-end Android and has contrast and accessibility problems, so use it sparingly. |
| C4 | Parul student email domain = `paruluniversity.ac.in` | ⚠️ | The university's main domain is `paruluniversity.ac.in`, but **I couldn't confirm the student mail domain**. Check it with a real student address before Day 1. It goes in config as an allow-list, never hard-coded. |
| C5 | DPDP Act 2023 consent can wait until Phase 3 | ⚠️ | A consent checkbox and a privacy page cost about an hour. Ship them in the MVP. |

## Summary of Level 1

**Keep:** Supabase + RLS, the golden-path-first idea, the role model in the data layer, Mode A then Mode B attendance, certificates triggered by "event complete", no SMS OTP, the CSV/HOD flag ideas.

**Change:** the separate web and mobile codebases (move to Expo universal), the QStash queue (replace with an atomic Postgres RPC), Vercel (replace with Supabase Edge Functions plus free static hosting), S3 (replace with R2 or Supabase Storage), the fail-open domain check (make it fail closed), stored certificate PDFs (render on demand), the 4-person / no-deadline plan (2 people, 10 days).

**Add:** a keep-alive cron, a backup cron, explicit GRANTs in migrations, a PWA install path for iPhone, the consent checkbox in the MVP, and an honest cost note (Apple $99/yr, Play $25 once).
