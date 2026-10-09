# Level 2: Fact Check and Best Free Stack

**Date checked:** 2026-10-09. Free tiers change often, so **check the live pricing pages again on Day 0** (the checklist is at the bottom).
Confidence: 🟢 confirmed by an official source · 🟡 third-party sources or conflicting figures · 🔴 not verifiable / assumption

---

## 1. Fact-check table

| Claim / question | Finding | Conf. | Source |
|---|---|---|---|
| Is AWS S3 free "for a while"? | New accounts (after 2025-07-15) choose a **Free Plan**: $100 credit, up to $200 with onboarding tasks, for **6 months**. After that you upgrade to paid, or the account closes after a grace period and **resources are deleted**. The old "5 GB S3 for 12 months" applies only to legacy accounts. | 🟢/🟡 | [Neowin](https://www.neowin.net/amp/aws-free-tier-overhauled-new-users-get-200-in-credits-but-theres-a-catch/), [freetier.co](https://freetier.co/articles/aws-free-tier-changes-july-15-2025), [DEV](https://dev.to/aws-builders/whats-new-in-aws-free-tier-2025-2ba5) |
| Better free object storage? | **Cloudflare R2**: 10 GB-month, 1M Class A (writes) and 10M Class B (reads) per month, **$0 egress**, permanently free. S3-compatible API. | 🟢 | [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing) |
| Supabase free limits | 500 MB DB, 1 GB file storage, 50,000 MAU, 2 free projects, about 5 GB egress. Exceeding a limit **stops** the service rather than billing you. | 🟡 (third-party, figures agree) | [JetAdmin 2026](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/), [costbench](https://costbench.com/software/database-as-service/supabase/free-plan/) |
| Supabase free projects pause? | **Yes, after 7 days with no DB requests.** Cron jobs stop while paused. | 🟡 | [runhooks](https://runhooks.app/blog/preventing-supabase-free-tier-pausing/), [JetAdmin](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/) |
| Supabase backups on free | Assume **none** (sources conflict). | 🟡 | same as above |
| New tables reachable through the API automatically? | **No longer.** Explicit `GRANT`s are required for new projects from **2026-05-30**, and **all projects from 2026-10-30**. RLS is unchanged. | 🟢 | [Supabase changelog #45329](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically) |
| Supabase Edge Functions free | About **500K invocations/month** | 🟡 | [JetAdmin](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/) |
| Supabase Cron (pg_cron) on free | Available, but in beta. At most 8 concurrent jobs, each under 10 min. | 🟢 | [Supabase Cron docs](https://supabase.com/docs/guides/cron.md) |
| QStash free can carry 1,000 check-ins? | Free = **1,000 messages/day** (one older page says 500). Every retry counts as a message. **One big event uses up the day.** | 🟢 | [Upstash QStash pricing](https://upstash.com/pricing/qstash.md) |
| Vercel Hobby fine? | **Non-commercial use only.** About 1M function invocations/month, hard caps, and the deployment **pauses** when a cap is hit. | 🟡 | [deploywise](https://deploywise.dev/blog/vercel-free-tier-limits-2026), [livemy.app](https://livemy.app/blog/vercel-pricing) |
| FCM free? | **Yes, free on every plan, including Spark.** | 🟢 | [Firebase pricing plans](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans) |
| Expo Push free? | **Yes, free.** Limit is 600 notifications/sec per project. It wraps FCM and APNs for you. | 🟢 | [Expo push FAQ](https://docs.expo.dev/push-notifications/faq/) |
| Expo EAS Build free | **15 Android + 15 iOS builds/month**, low-priority queue (waits can exceed 90 min at peak). OTA updates free up to 1K MAU. | 🟢 | [Expo pricing](https://expo.dev/pricing), [Expo billing docs](https://docs.expo.dev/billing/plans/) |
| iPhone app store distribution free? | **No.** Apple Developer Program ≈ **$99/yr** (about ₹8,700 reported in India). Some Indian users report payment errors, so test early. **TestFlight also needs it.** | 🟡 | [Apple dev forum](https://developer.apple.com/forums/thread/835350) |
| Google Play free? | **$25 one-time** fee. APK sideloading is free. | 🟢 | [Play Console help](https://support.google.com/googleplay/android-developer/answer/6112435) |
| Luma web-first/PWA only? | **False.** Luma has native iOS (full feature set) and Android apps. | 🟢 | [Luma iOS help](https://help.luma.com/p/luma-ios-app.md), [Luma Android help](https://help.luma.com/p/luma-android-app), [App Store](https://apps.apple.com/app/id1546150895) |
| Parul student mail domain | Main domain `paruluniversity.ac.in`. **Student mailbox domain not confirmed.** | 🔴 | [paruluniversity.ac.in](https://paruluniversity.ac.in) (verify with a real student email) |
| Firebase Phone Auth needs billing | Consistent with the Firebase pricing docs (SMS is billed). | 🟢 | [Firebase pricing plans](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans) |

---

## 2. Final free stack (₹0/month)

| Need | Choice | Why this over the v2 plan | Free limit to watch |
|---|---|---|---|
| **App (iOS + Android + Web)** | **Expo SDK (React Native) + Expo Router + TypeScript**, one codebase | One build for 3 platforms. A separate Next.js and RN rebuild would double the work. | EAS builds 15+15/month |
| UI kit | **Tamagui** or **NativeWind** (Tailwind for RN). Pick one on Day 0. | Works on web and native | n/a |
| Database / Auth / RLS | **Supabase** (Postgres, Auth with Google + email, RLS) | Already decided in v2. Correct. | 500 MB DB, 50k MAU, 7-day pause |
| Server logic | **Postgres functions (RPC)** + **Supabase Edge Functions** | Atomic, close to the data, no extra vendor | 500K invocations/mo |
| Concurrency (check-in spikes) | **One `check_in()` Postgres function** + `UNIQUE(registration_id)` | Replaces QStash + jitter. No message cap. Idempotent. | DB connections (use the pooler) |
| Scheduled jobs | **Supabase Cron** (in-DB) + **GitHub Actions** (keep-alive, backup) | Free, no extra vendor | Actions minutes are free for public repos and generous for private |
| Files: profile photos, logos | **Supabase Storage (1 GB)** for MVP → **Cloudflare R2** if it fills | No S3 credit clock | 1 GB / 10 GB |
| Certificates | **Rendered on demand** (client-side PDF / `react-native-html-to-pdf` / web print) from a DB row + verification URL | **0 bytes stored** | none |
| Push | **Expo Push** (Android + iOS) + **Web Push** for installed PWA | Free. Wraps FCM/APNs. | 600/s. iOS native push needs the Apple account. |
| Web hosting | **Cloudflare Pages** (static export of Expo web) | Free, commercial use allowed, fast in India. Vercel Hobby is the fallback. | 500 builds/mo |
| iPhone without paying | **PWA** (Add to Home Screen) + **Expo Go** for internal testing | ₹0 | Web push needs iOS 16.4+ and an installed PWA |
| Android | **EAS APK** (sideload, free) → Play Store when the $25 is approved | ₹0 to start | n/a |
| Exports for HOD | **CSV download** button (Sheets sync in v2) | 5% of the effort for 90% of the value | n/a |
| Monitoring | **Sentry** (free developer plan) + Supabase logs | Crash visibility | 5k errors/mo (check) |
| CI/CD | **GitHub Actions** + **EAS Update** for OTA | Free | n/a |
| Load test | **k6** (open source, run locally) | Proves the 1,000-concurrent claim | n/a |

### The only real money questions
1. **Apple Developer, ~$99/yr.** Needed only for an App Store or TestFlight iPhone app. Until then iPhone users get the PWA. *Ask the university or a club sponsor to pay. A university can also enroll as an organization.*
2. **Google Play, $25 once.** Optional. The APK works without it.

Everything else is ₹0 within the limits above.

---

## 3. Capacity check: does free survive 30,000 users?

| Resource | Estimate at 30k users | Free limit | Verdict |
|---|---|---|---|
| Auth MAU | ≤30k | 50k | ✅ |
| DB size | users 30k × ~1 KB + events/regs/attendance (~300k rows × ~200 B) ≈ **~100 MB** | 500 MB | ✅ (stay out of blobs) |
| Storage | 30k avatars × 50 KB (compress!) ≈ 1.5 GB | 1 GB Supabase / 10 GB R2 | ⚠️ → avatars on R2, or use the Google photo URL |
| Egress | Mostly JSON. Images go through R2 (no egress cost). | ~5 GB | ⚠️ Watch it. Paginate and cache. |
| Check-in spike | 1,000 RPC calls in 60 s ≈ 17/s | Postgres handles thousands per second | ✅ (prove it with k6) |

---

## 4. Day-0 re-verification checklist (10 minutes)
- [ ] supabase.com/pricing: DB, storage, egress, MAU, pause rule
- [ ] expo.dev/pricing: build counts
- [ ] developers.cloudflare.com/r2/pricing and pages limits
- [ ] Apple Developer enrollment works with your card (test it, don't buy yet)
- [ ] Confirm the **Parul student email domain** with 2 real student emails
- [ ] Confirm the Supabase project is created *after* the GRANT change and migrations include grants
