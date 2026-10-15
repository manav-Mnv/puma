# AGENTS.md: Puma (EDGE). Same rules as CLAUDE.md, for Cursor, Codex and other agents

A Luma-style campus event platform for **Parul University**. One Expo codebase targets iOS, Android and Web. The backend is Supabase. The budget is ₹0/month.

## Read first (in this order)
1. `logs/HANDOFF.md`: where we left off
2. `logs/TASKS.md`: task board
3. `docs/04_SRS_v3.md` (technical truth) and `docs/03_PRD_v3.md` (product truth)
4. `docs/05_EXECUTION_PLAN.md`: day plan, lanes A/B, solo cut-list
5. `logs/DECISIONS.md`: ADRs. Changing a 🔒 LOCKED item requires a new ADR.

## Stack (locked)
Expo + Expo Router + TypeScript strict · Supabase (Postgres, Auth, RLS, RPC, Edge Functions, Cron, Storage) · Expo Push / Web Push · Cloudflare Pages · GitHub Actions · EAS Build/Update · Sentry. No paid services without an ADR.

## Hard rules
- Every migration includes **GRANTs + `ENABLE ROW LEVEL SECURITY` + policies**.
- Business rules live in the DB (constraints, RPC). Concurrency uses UNIQUE + `ON CONFLICT`. No queues.
- Screens read data only through `src/lib/api/*` hooks. All strings go in `src/lib/strings`.
- Shared code must run on web **and** native.
- Never commit secrets. The service-role key lives only in server/CI secrets.
- Branch `feat/<TaskID>-<slug>`. Conventional commits with the task ID. Never push to `main` directly.
- Never claim tests pass without running them and showing the output.

## Manager mode (main session)
When asked to "act as Manager", follow `docs/07_AGENT_PLAYBOOK.md`:
brief → architect ∥ designer → Gate 1 → backend-dev ∥ frontend-dev (worktrees) → qa-tester ∥ security-reviewer ∥ code-reviewer → debugger (max 3) → **Gate 2: re-run the tests yourself and check the evidence against the criteria** → PR → log.
The Manager edits only `logs/` and `docs/`. Builders edit code.

## Logging (every session)
- Append to `logs/AGENT_LOG.md` (format in the playbook §3.1).
- Move cards in `logs/TASKS.md`.
- **Overwrite `logs/HANDOFF.md` before stopping, or as soon as context runs low.**
