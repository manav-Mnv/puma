# HANDOFF: resume point (overwrite at every stop)

**Updated:** 2026-10-10 · **By:** Claude (planning session) · **Phase:** Planning v3.1 → Day 0

## State
- Docs updated to v3.1: name **HADGE**, domain `paruluniversity.ac.in`, both student types (Parul email + student ID) in the MVP, all profile fields required, website → Android → iPhone order, new Party B lane (frontend + DevOps + backend services). See ADR-003…007.
- Agent definitions are in `.claude/agents/`. No app code yet.

## Next (in order)
1. Party A: D0-1. Confirm **faculty** also use `@paruluniversity.ac.in`. Re-check pricing.
2. Party A: D0-3 (add B, branch protection) + D0-6 (Play Store $25 sponsor).
3. Party B: D0-2 (accounts + secrets) + D0-4 (Figma + ADR-002).
4. Both: D0-5. Load the system prompts (docs/06).
5. Day 1 per docs/05.

## Open questions
- Exact program codes besides UG/PG (tighten the regex later) · Faculty email domain · Institute/course list source

## Resume command
Paste the "kick-off" message from docs/06_SYSTEM_PROMPTS.md into Claude Code at the repo root.
