# 11: Frontend Guide (for Hemanto, Party B)

Everything you need to change EDGE's UI (website, Android APK, iPhone) safely.
Read it once top to bottom. It takes about 10 minutes.

---

## 1. Get access (one time)
1. **Accept the GitHub invite** to `manav-Mnv/puma` (in your email, or https://github.com/notifications).
   You get push access to branches, so **no fork is needed**.
2. Install on your laptop:
   | Tool | Why | Check |
   |---|---|---|
   | **Git** | code | `git --version` |
   | **Node.js 22 LTS** (20+ works) | runs the app | `node -v` |
   | **Android Studio** | Android emulator | opens |
   | VS Code (recommended) | editor | n/a |

   You do **not** need Docker, Supabase CLI or EAS for UI work.

## 2. Clone and create your branch
```bash
git clone https://github.com/manav-Mnv/puma.git
cd puma
git checkout -b feat/ui-<area> origin/main     # e.g. feat/ui-tickets
npm ci                                          # installs exact package versions
```
Branch names: `feat/ui-<area>` for new UI, `fix/ui-<thing>` for fixes. **Never commit to `main` directly.** It's protected anyway.

## 3. The `.env` file (what you need, and what you must never have)
Create a file named `.env` in the project root (it's git-ignored):
```
EXPO_PUBLIC_SUPABASE_URL=<Manav sends you this>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<Manav sends you this (starts with sb_publishable_)>
EXPO_PUBLIC_SENTRY_DSN=
```
- These two values are **public** (they ship inside the app anyway), so it's fine for Manav to share them.
- You must **never** receive or use: the service-role key, the DB password, or any token (GitHub, Cloudflare, Expo, Brevo, Firebase). UI work never needs them.
- ⚠ The app talks to the **live database**. Test with your own accounts, and don't create junk data in bulk.

## 4. Run it
```bash
npx expo start
```
Then, in that terminal:
| Press | Opens |
|---|---|
| `w` | **Website** in your browser (http://localhost:8081) |
| `a` | **Android emulator** (start it first, see below) |
| scan the QR with the **Expo Go** app | a real phone (same Wi-Fi). On campus Wi-Fi use `npx expo start --tunnel` |

Changes reload instantly. Stop with `Ctrl+C`.

### Android Studio emulator (one time)
1. Android Studio → **More Actions → Virtual Device Manager → Create Device**
2. Pick **Pixel 7** → system image **API 34 or 35** (download it) → Finish
3. Press ▶ to start the emulator, then in the `npx expo start` terminal press **`a`**.
   It installs **Expo Go** in the emulator and opens EDGE.
4. If `a` says "no Android device": open Android Studio's SDK Manager → make sure **Android SDK Platform-Tools** is installed, then restart the terminal.

Good to know:
- **Sign-in:** use **email + password** in Expo Go / the emulator. "Continue with Google" needs the real APK or the website.
- **Camera / QR scanning** doesn't really work in the emulator. Use the scanner's **"type the entry code"** box, or test on a real phone.
- **iPhone:** the iOS simulator needs a Mac. On Windows, test iPhone UI with **Expo Go on a real iPhone**.
- To try a **staff screen** (Create, Scanner, Manage portal), ask Manav to give your account a role (Faculty/AD) in *Manage → Manage roles*.

## 5. Where the UI lives (what you may change)
```
src/
  app/                 ← SCREENS (each file = a route)
    (tabs)/            ← bottom tabs: index (Explore), tickets, create, profile
    event/[id]/        ← event page, scan, display (projector QR), edit
    manage/, super.tsx, clubs.tsx, inbox.tsx, certificates/, verify/, checkin/, onboarding.tsx, sign-in.tsx
  components/          ← reusable UI: button, text-field, chip-group, checkbox, cards, tabs…
  constants/theme.ts   ← COLORS, spacing, fonts (start redesigns here)
  lib/strings/         ← ALL user-facing text (change wording here, not in screens)
assets/images/         ← icons, splash, tab icons
app.json               ← app name/icon/splash colors (ask before changing anything else)
```
✅ **You own:** `src/app/**` (layout and visuals only), `src/components/**`, `src/constants/theme.ts`, `assets/**`, `src/lib/strings/**` (wording).
⛔ **Don't touch** (ask Manav first): `src/lib/api/**` (data), `src/lib/supabase.ts`, `supabase/**` (database), `.github/**` (CI/deploy), `eas.json`, `app.config.ts`, `package.json` (new packages need approval).

## 6. Different UI for website vs Android vs iPhone
Expo picks a file by platform **automatically**, so keep one codebase:

| File name | Used on |
|---|---|
| `tickets.tsx` | default (every platform without its own file) |
| `tickets.web.tsx` | **website only** |
| `tickets.android.tsx` | **Android APK only** |
| `tickets.ios.tsx` | **iPhone only** |
| `tickets.native.tsx` | Android + iPhone (not web) |

Example already in the repo: `src/components/app-tabs.tsx` (phone tabs) vs `app-tabs.web.tsx` (website top bar).

For a small difference inside one file:
```tsx
import { Platform } from 'react-native';
const padding = Platform.select({ web: 32, android: 16, ios: 20 });
```
**Best practice:** put platform-specific **components** in `src/components/` (e.g. `event-card.web.tsx`) and keep the screen file shared, so data logic isn't copied three times.

## 7. Rules (read these)
1. **Data only through hooks** in `src/lib/api/*` (e.g. `useEvents`, `useMyTickets`). Never call Supabase from a screen.
2. **All text in `src/lib/strings`**. No hard-coded English in screens.
3. **Keep these button/field labels exactly**, or update `e2e/golden-path.spec.ts` in the same PR. The automated test clicks them by name:
   `New here? Create an account` · `Create account` · `Email` · `Password` · `Next` · `Finish` · `Full name` · `Enrollment / student ID` · `Course / program` · `Mobile number` · `Title` · `Venue` · `Date (YYYY-MM-DD)` · `Starts (HH:MM, 24h)` · `Ends (HH:MM, 24h)` · `Publish event` · `Register` · `Scan tickets` · `Or type the entry code` · `Check in` · `Scan next` · `Mark event complete` · `Yes, complete and issue certificates`, plus the `ticket-code` testID and the `Explore` heading.
4. **Accessibility:** every touchable keeps `accessibilityRole` + `accessibilityLabel`. Text contrast ≥ 4.5:1. Never show status by color alone (keep ✓ / ⚠ / text).
5. **Every screen** handles loading, empty, error and offline states.
6. **Web + phone both work** after your change. Check `w` and `a` before you push.
7. **Keep it light.** No heavy blur/glass on Android (low-end phones). Ask before adding packages.
8. **Small PRs:** one area per PR (e.g. "Tickets redesign"), under ~400 lines when possible.

## 8. Before you open a PR (checklist)
```bash
git pull origin main          # get the latest, fix any conflicts
npm run typecheck             # must print nothing / exit 0
npm run lint                  # 0 errors
npm test                      # all Jest tests pass
npx expo export --platform web   # website must build
```
Then check manually:
- [ ] Website (`w`) and Android emulator (`a`) both look right
- [ ] Dark mode and light mode both readable
- [ ] Small phone width (≈360px) has no cut-off text or buttons
- [ ] Loading / empty / error states still show
- [ ] No labels from rule 3 changed (or the E2E is updated)
- [ ] Screenshots ready: website + Android (+ iPhone via Expo Go if you changed iOS)

## 9. Open the PR
```bash
git add -A
git commit -m "feat(ui): tickets redesign"       # conventional commits
git push -u origin feat/ui-tickets
```
On GitHub, click **Compare & pull request**, base `main`, and fill in the template:
- What changed (and which platforms)
- Screenshots (web / Android / iPhone)
- Checklist from section 8

The PR runs **3 automatic checks**: `app` (typecheck/lint/tests/web build), `db`, and `e2e` (full student journey in a browser). All must be ✅.
**Don't merge your own PR.** Manav reviews and merges. Merging `main` deploys the website automatically.

## 10. If something breaks
| Problem | Fix |
|---|---|
| `Missing EXPO_PUBLIC_SUPABASE_URL` | `.env` missing or misnamed. See section 3 |
| Blank page / red error | read the error in the terminal; `Ctrl+C`, then `npx expo start -c` (clears cache) |
| `e2e` check fails on your PR | you changed a label from rule 3; restore it or update `e2e/golden-path.spec.ts` |
| Merge conflict | `git pull origin main`, fix the files marked with `<<<<<<<`, commit, push |
| Emulator not found | start the emulator first, then press `a` |

Questions about data, new fields or new screens: ask Manav. Don't change `src/lib/api` or `supabase/`.
