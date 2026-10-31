# 09: Setup Guide: Accounts, Software & Connections (EDGE)

Do this once, in order, ticking each box as you go. Everything is **free** except Google Play ($25 once) and Apple ($99/yr, later).
Website menus change sometimes. If a button name is slightly different, look for the closest match.

> ✅ **Fact-checked 2026-10-10.** Three fixes compared with the first draft: (1) install the Supabase CLI per project, not with `npm -g`; (2) branch protection and environments on a **private** repo need GitHub Pro (free with the Student Developer Pack); (3) a new **personal** Play Console account needs **12 testers × 14 days** of closed testing before production. See ⚠️ boxes.

> 🔐 **Golden rule for keys**
> - **Public** (safe in the app): Supabase URL, Supabase anon/publishable key
> - **Secret** (never in code, chat, Drive or screenshots): service-role key, DB password, all tokens
> - Secrets go ONLY into **GitHub → repo → Settings → Secrets and variables → Actions**

Keep a private note (e.g. a password manager) while you set up, and paste each value into GitHub as you go.

---

## PART 1: Software on your laptop (Windows)

| # | Software | Where to get it | Why | Check it works |
|---|---|---|---|---|
| 1 | **Git** | git-scm.com ✅ already installed | Code history | `git --version` |
| 2 | **GitHub CLI** | cli.github.com ✅ already logged in | Repos, PRs | `gh auth status` |
| 3 | **Node.js LTS (20 or newer)** | nodejs.org → "LTS" | Runs the app and the Supabase CLI | `node -v` (must be v20+) and `npm -v` |
| 4 | **Docker Desktop** | docker.com/products/docker-desktop | Runs Supabase locally for testing | open Docker, then `docker ps` |
| 5 | **Supabase CLI** | ⚠️ **Not** `npm install -g supabase` (global npm install is not supported). On Day 1 it's added to the project as a dev dependency and you run it with `npx supabase …`. Optional global install: **Scoop** (`scoop bucket add supabase https://github.com/supabase/scoop-bucket.git` then `scoop install supabase`). | Push DB changes | `npx supabase --version` (after Day 1) |
| 6 | **EAS CLI** | `npm install -g eas-cli` | Build the Android app | `eas --version` |
| 7 | **VS Code** (optional) | code.visualstudio.com | Editor | n/a |
| 8 | **Claude Code** ✅ | already using | Agents | n/a |

On your **Android phone**: install **Expo Go** from the Play Store (to test the app instantly).

- [ ] All installed and checked

---

## PART 2: Supabase (the backend), *Party B (D0-2)*

**Website:** https://supabase.com → sign in with GitHub

1. **New project**
   - Organization: create one (e.g. `edge-parul`)
   - Project name: `edge-prod`
   - Database password: click **Generate** and save it as `SUPABASE_DB_PASSWORD`
   - Region: **South Asia (Mumbai)**
   - Plan: **Free**
   - Wait about 2 minutes for it to finish.
2. **Get the API keys:** Project → **Settings → API** (or "API Keys")
   - **Project URL** → save as `EXPO_PUBLIC_SUPABASE_URL`
   - **anon / publishable key** → save as `EXPO_PUBLIC_SUPABASE_ANON_KEY` (public)
   - **service_role / secret key** → save as `SUPABASE_SERVICE_ROLE_KEY` (🔐 secret)
3. **Get the project ref:** it's the random ID in your project URL (`https://<THIS-PART>.supabase.co`). Save it as `SUPABASE_PROJECT_REF`.
4. **Access token (for CI):** click your avatar (top-right) → **Account → Access Tokens → Generate new token** → name it `github-ci` → save as `SUPABASE_ACCESS_TOKEN` (🔐)
5. **Auth settings:** Project → **Authentication → URL Configuration**
   - Site URL: your website URL (use `http://localhost:8081` for now and update it after the Cloudflare step)
   - Redirect URLs: add `http://localhost:8081/**`, your Cloudflare URL `https://<project>.pages.dev/**`, and `edgepu://**` (for the Android app)
6. **Email sign-in:** Authentication → **Providers → Email** → make sure it's **enabled** and "Confirm email" is **on**.
   - Note: Supabase's built-in email sender is rate-limited (a few emails per hour) and is meant for testing. Before the pilot (Day 9), connect a free SMTP sender (e.g. Resend or Brevo free tier) under **Authentication → Emails → SMTP**. Most students will use Google sign-in, which sends no email.
7. **Add Party A as admin:** Organization → **Team** → invite Party A's email as **Owner/Admin**.

- [ ] Project created (Mumbai) · [ ] 5 values saved · [ ] Email auth on · [ ] Party A invited

---

## PART 3: Google Sign-In, *Party A or B*

**Website:** https://console.cloud.google.com (sign in with your Google account)

1. **Create project:** top-bar project picker → **New Project** → name `edge-parul` → Create → select it.
2. **OAuth consent screen:** menu → **APIs & Services → OAuth consent screen** (may be called "Google Auth Platform → Branding")
   - User type: **External**
   - App name: `EDGE` · support email: yours · developer contact: yours
   - Scopes: only the defaults, `email`, `profile`, `openid`
   - **Publish app** (move it from "Testing" to "In production") so any student can sign in. Basic scopes don't need Google's verification review. If you upload a logo, Google may ask for a quick brand check, so skip the logo for now.
3. **Create credentials:** **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application** · name `edge-supabase`
   - **Authorized redirect URI:** copy it from Supabase → **Authentication → Providers → Google** (it looks like `https://<ref>.supabase.co/auth/v1/callback`) and paste it here
   - Create, then copy the **Client ID** and **Client Secret**
4. **Paste into Supabase:** Supabase → **Authentication → Providers → Google** → enable → paste the Client ID + Client Secret → **Save**.
5. *(The native Android Google button comes later, on Day 2–3 if needed: create a second OAuth client of type **Android** using the app's SHA-1 from `eas credentials`. The web-redirect flow above already works on Android without it.)*

- [ ] Google login enabled in Supabase

---

## PART 4: Cloudflare Pages (website hosting), *Party B*

**Website:** https://dash.cloudflare.com → sign up (free)

1. **Account ID:** on the dashboard home, right sidebar (or **Workers & Pages** overview) → copy the **Account ID** → save as `CLOUDFLARE_ACCOUNT_ID`
2. **API token:** avatar → **My Profile → API Tokens → Create Token** → template **"Edit Cloudflare Workers"** (it includes **Account → Workers Scripts → Edit**, which the site needs: it is hosted as a Worker, not Pages) → Account Resources: your account → Create → save as `CLOUDFLARE_API_TOKEN` (🔐). A Pages-only token fails with "No access to the specified service".
3. **Pages project:** **Workers & Pages → Create → Pages → Direct Upload** → name it `edge-parul` → you'll get `https://edge-parul.pages.dev` (if the name is taken you'll get a variant, so note the real URL). The GitHub Action deploys to it on Day 2.
4. Go back to **Supabase → Auth → URL Configuration** and set Site URL = your `pages.dev` URL.

- [ ] Account ID + token saved · [ ] `pages.dev` URL reserved

---

## PART 5: Expo / EAS (Android builds, updates, push), *Party B*

**Website:** https://expo.dev → sign up (free)

1. Create an **organization** `edge-parul` (optional) and invite Party A.
2. **Access token:** avatar → **Account settings → Access tokens → Create** → name it `github-ci` → save as `EXPO_TOKEN` (🔐)
3. On your laptop: `eas login` (the project itself gets linked on Day 1 with `eas init`).
4. Push notifications: nothing to set up now. Expo Push is free, and the Android push credentials (FCM) get configured on Day 8 through `eas credentials`.

- [ ] `EXPO_TOKEN` saved · [ ] `eas login` works

---

## PART 6: Sentry (crash reports, optional), *Party B*

**Website:** https://sentry.io → sign up (free Developer plan)

1. Create a project → platform **React Native** → name it `edge-parul`
2. Copy the **DSN** → save as `EXPO_PUBLIC_SENTRY_DSN` (fine to ship in the app)
3. **Settings → Auth Tokens → Create** → save as `SENTRY_AUTH_TOKEN` (🔐)

- [ ] DSN + token saved (or skipped)

---

## PART 7: GitHub (put it all together), *Party A*

**Website:** https://github.com/manav-Mnv/puma

> ⚠️ **Private repo + GitHub Free = no branch protection and no Environments.** GitHub only offers protected branches, rulesets and Environments on **private** repos with **GitHub Pro / Team**. Deployment "required reviewers" on private repos need an even higher plan.
> **Fix (free):** apply for the **GitHub Student Developer Pack** (education.github.com/pack) with your Parul student email or ID card. It includes **GitHub Pro** at no cost, which enables branch protection and Environments on private repos. Approval usually takes a few days, so apply on Day 0.
> **Alternative:** make the repo **public**. Everything is then free, including unlimited Actions minutes, but anyone can read the code. Secrets stay safe in GitHub Secrets either way.

1. **Add Party B:** Settings → **Collaborators** → Add people → their GitHub username → role **Write**.
   Then edit `.github/CODEOWNERS`: uncomment the Party B lines and replace `@PARTY_B` with their handle.
2. **Apply for the Student Developer Pack** (see the box above). Until it's approved, follow the PR rules by convention.
3. **Branch protection** (once you have Pro, or if the repo is public): Settings → **Rules → Rulesets** (or **Branches**) → add a rule for `main`:
   - Require a pull request before merging (1 approval)
   - Require status checks to pass (add `ci` after it first runs on Day 1)
   - Block force pushes
4. **Secrets:** Settings → **Secrets and variables → Actions → New repository secret**. Add each one:

| Secret name | From |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Part 2.4 |
| `SUPABASE_PROJECT_REF` | Part 2.3 |
| `SUPABASE_DB_PASSWORD` | Part 2.1 |
| `SUPABASE_SERVICE_ROLE_KEY` | Part 2.2 |
| `EXPO_PUBLIC_SUPABASE_URL` | Part 2.2 |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Part 2.2 |
| `CLOUDFLARE_API_TOKEN` | Part 4.2 |
| `CLOUDFLARE_ACCOUNT_ID` | Part 4.1 |
| `EXPO_TOKEN` | Part 5.2 |
| `SENTRY_AUTH_TOKEN` | Part 6.3 (optional) |
| `EXPO_PUBLIC_SENTRY_DSN` | Part 6.2 (optional) |
| `BACKUP_ENCRYPTION_KEY` | make one: any long random password (from your password manager) |

5. **Production safety gate.** Because "required reviewers" isn't available on a private repo at our plan level, the **live-database deploy runs only when Party A starts it by hand**. It's a separate `workflow_dispatch` workflow ("Run workflow" button), restricted in the workflow so it runs only for `manav-Mnv`. Web and OTA deploys still run automatically after CI passes on `main`. The workflow is written on Day 1.

- [ ] Party B added · [ ] Student Pack applied (or repo made public) · [ ] `main` protected (once available) · [ ] 12 secrets added

---

## PART 8: Local `.env` file (on each developer's laptop)

The repo will have `.env.example` (Day 1). Copy it to `.env` (git-ignored) and fill in **only public** values:

```
EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
EXPO_PUBLIC_SENTRY_DSN=<optional>
```
Never put the service-role key or DB password in the app's `.env`.

---

## PART 9: Paid store accounts (sponsor pays)

| Store | Website | Cost | When | Notes |
|---|---|---|---|---|
| **Google Play Console** | play.google.com/console | $25 once | **start Day 0–1** | ID verification can take a few days. ⚠️ See the box below. |
| **Apple Developer** | developer.apple.com/programs | $99/yr | after Day 10 | Organization enrollment needs a **D-U-N-S number** (free, takes days). Test card payment early, because some Indian cards fail. |

> ⚠️ **Play Store's 12-tester rule.** A **personal** developer account created after Nov 2023 must run a **closed test with at least 12 testers opted in for 14 days in a row** before it can even apply for production. **So "live on the Play Store by Day 10" isn't possible on a personal account.**
> **Plan:** create the account on Day 0–1. On **Day 6**, upload the first build to a **closed testing** track and invite **15–20 Swift Coding Club members** (a buffer in case some drop out). They install EDGE **from the Play Store** for the Day 10 pilot. Apply for production around **Day 20**, and a public release follows Google's review.
> **Or:** an **organization** account (university or club, needs a D-U-N-S number) is exempt from this rule, but getting a D-U-N-S number can take 1–2+ weeks. The APK link works for anyone in the meantime.

- [ ] Play account created (sponsor paid) · [ ] Closed-test tester list (15–20 Gmail addresses) collected · [ ] Apple later

---

## PART 10: Final check (5 minutes)

- [ ] Supabase project open, region Mumbai, Google + Email providers enabled
- [ ] `pages.dev` URL exists
- [ ] `eas login` works, and Node is v20+
- [ ] Docker Desktop running
- [ ] All GitHub secrets present (only names are visible, which is normal)
- [ ] Student Developer Pack applied (or repo public)
- [ ] Party A has admin on Supabase, Cloudflare, Expo and Sentry (so solo mode is possible)

✅ Then open Claude Code in the repo and say:
**"Act as Manager per CLAUDE.md. Day 0 is done. Start Day 1 per docs/05."**

---

## What you do vs what Claude/agents do

| You do (accounts, money, passwords) | Claude/agents do (after this) |
|---|---|
| Create accounts, verify identity, pay fees | Write all app code, DB tables, security rules |
| Copy keys into GitHub Secrets | Write CI/CD workflows that use those secrets |
| Approve and start production DB deploys | Run tests, open PRs, keep logs |
| Publish the Google OAuth app, invite Play testers, submit to stores | Prepare store listing text and a screenshot checklist |

### Sources for the ⚠️ fixes
- Supabase CLI install: https://supabase.com/docs/guides/local-development/cli/getting-started
- GitHub protected branches / environments by plan: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches · https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments
- Play Console testing requirement for new personal accounts: https://support.google.com/googleplay/android-developer/answer/14151465
