# CI/CD, Environments and Repo Standards

The workflow YAML gets written on **Day 1** (task D0-2/T03, owned by `release-manager`). This doc is the spec that work follows.

## Environments
| Env | Supabase | Web | Mobile | Trigger |
|---|---|---|---|---|
| **local** | `supabase start` (Docker) | `npx expo start --web` | Expo Go / dev build | developer |
| **preview** | local DB inside CI (ephemeral) | Cloudflare Pages preview URL per PR | EAS Update channel `preview` | every PR |
| **production** | Supabase cloud project (free) | Cloudflare Pages prod | EAS Update channel `production` + APK | merge to `main` (+ manual approval for DB) |

> With only 2 free Supabase projects, use **prod + a local DB in CI** rather than a cloud staging project. Keep the second free slot for an emergency restore.

## Pipelines (GitHub Actions)
| Workflow | Trigger | Steps |
|---|---|---|
| `ci.yml` | PR, push | install (cached) → typecheck → lint → unit tests → `supabase start` + `db reset` + **RLS/RPC tests** → RLS-enabled check → web export build → Playwright smoke |
| `deploy.yml` | push to `main` | gate: CI green → `supabase db push` (environment `production`, **required reviewer = Party A**) → Cloudflare Pages deploy → `eas update --channel production` → smoke against the prod URL |
| `mobile-build.yml` | tag `v*` or manual | `eas build -p android --profile production` (APK/AAB). iOS only when Apple is funded. |
| `keepalive.yml` | cron daily | a lightweight query to Supabase so the free project never pauses |
| `backup.yml` | cron weekly + manual | `pg_dump` → encrypted artifact (30-day retention). Monthly restore drill into a local DB. |
| `loadtest.yml` | manual | k6 against `self_check_in` (1,000 VUs / 60 s), with thresholds that fail the run |

## Secrets (GitHub → Settings → Secrets, never in the repo)
`SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY` (server only), `EXPO_TOKEN`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `SENTRY_AUTH_TOKEN`, `BACKUP_ENCRYPTION_KEY`.
The client gets only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

## Repo standards
- **Branch protection on `main`:** PR required, CI green, 1 approval (Party A is code owner), linear history, no force-push.
- **Commits:** Conventional Commits with the task ID, e.g. `feat(checkin): idempotent check_in_by_ticket (T07)`.
- **PRs:** use the template, under 400 lines, screenshots for UI, test output pasted.
- **Releases:** semver tags, with release notes generated from commits.
- **What NOT to commit:** `.env*` (except `.env.example`), `node_modules`, build outputs, `logs/*.local.md`, DB dumps, keystores, `*.p8`/`*.p12`, `CLAUDE.local.md`.
- **Dependabot** weekly for npm + GitHub Actions.

## Release checklist (release-manager)
1. CI is green on `main`. All R-tasks in TASKS.md are **Verified**.
2. Backup taken right before `db push`.
3. Deploy, then run the smoke test on the prod URL.
4. Tag, write release notes, and update HANDOFF + AGENT_LOG.
5. Rollback: revert the commit → redeploy web + `eas update --republish` of the previous group. Roll the DB forward with a fix migration (never edit applied migrations).
