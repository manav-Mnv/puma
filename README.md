# Puma (HADGE): *Every Node, Connected.*

A Luma-style event platform for **Parul University**: discover events, register in one tap, check in by QR, and receive a verified certificate automatically. It covers the **website and Android first, then iPhone**, all from one Expo codebase, on a **₹0/month** stack.

> Status: **planning complete, build starts Day 1.** No application code yet.

## Docs
| # | Doc | What it is |
|---|---|---|
| 01 | [Assumptions Audit](docs/01_ASSUMPTIONS_AUDIT.md) | Level 1: every v2 assumption marked holds / shaky / false |
| 02 | [Fact Check & Free Stack](docs/02_FACT_CHECK.md) | Level 2: sourced checks (S3, Supabase, QStash, Expo, Apple…) and the final free stack |
| 03 | [PRD v3](docs/03_PRD_v3.md) | Level 3: final product requirements |
| 04 | [SRS v3](docs/04_SRS_v3.md) | Level 3: final technical spec (data model, RLS, RPC, NFRs, traceability) |
| 05 | [Execution Plan](docs/05_EXECUTION_PLAN.md) | 10 days, Party A / Party B lanes, solo-mode cut-list |
| 06 | [System Prompts](docs/06_SYSTEM_PROMPTS.md) | Paste-in prompts for Party A and Party B |
| 07 | [Agent Playbook](docs/07_AGENT_PLAYBOOK.md) | Multi-agent loop, gates, logging, token-out recovery |
| 08 | [CI/CD & Repo](docs/08_CICD_AND_REPO.md) | Pipelines, environments, secrets, release flow |
| 09 | [Setup Guide](docs/09_SETUP_GUIDE.md) | Day 0: accounts, software, keys, GitHub secrets (fact-checked) |
| — | [archive/](docs/archive) | Original v2.0 PRD and SRS |

## Logs (the project's memory)
[HANDOFF](logs/HANDOFF.md) · [TASKS](logs/TASKS.md) · [DECISIONS](logs/DECISIONS.md) · [AGENT_LOG](logs/AGENT_LOG.md)

## Stack
Expo (React Native + Expo Router, TypeScript) · Supabase (Postgres, Auth, RLS, Edge Functions, Cron, Storage) · Expo Push · Cloudflare Pages · Cloudflare R2 (only if needed) · GitHub Actions · EAS · Sentry
