# Kol Mail Desk v2 — Web (Next.js)

## Purpose

React/Next.js frontend for kol-mail-desk v2. This repo OWNS:

- All UI pages (workbench, board, team, templates, scheduled, auth)
- Reusable components (workbench shell, draft panel, board pipeline, etc.)
- Client-side state, rich text editor, HTML email rendering
- API client that talks to the Spring backend

## Stack

- Next.js 15 + React 18 + TypeScript
- Tailwind CSS
- TipTap (rich text editor — keep)
- TanStack Query for client data fetching

## Out of scope (in this repo)

- No Supabase clients (legacy). Auth/session via Spring.
- No direct calls to Gmail / Feishu / Kimi. Backend owns those.
- No business logic in Next.js `/api` routes — we don't ship Next API routes anymore.

## Source of truth

- Same shared docs as backend (`../kol-mail-desk-v2-docs/specs/*`).
- UI feature checklist: `feature-parity-v3.3.md`.
- API to consume: `api-contract-v1.yaml`.

## Legacy reuse policy

Legacy repo at `../kol-mail-desk`. You MAY copy and adapt:

- `components/*` (UI primitives)
- `lib/domain.ts`, `lib/workbench.ts`, `lib/team.ts` (pure types/heuristics)
- `lib/ai/prompts.ts` (read-only; prompts MOVED to backend `resources/prompts/`)
- `app/*/page.tsx` JSX shells (delete data-loading code)
- Tailwind / postcss configs

You MUST NOT copy:

- `lib/data/*`, `lib/gmail/*`, `lib/feishu/*`, `lib/supabase/*`, `lib/audit.ts`
- `app/api/*`
- Any direct Supabase imports

## Hard rules

- All server data MUST come from the Spring backend via `lib/api-client/*`.
- Pages are RSC where reasonable; no service-role DB access from RSC.
- Auth is HttpOnly cookie set by backend; no client-side token juggling.
- All user-visible strings stay in Simplified Chinese (per v3.3 PRD).

## Current phase

**Phase 0 — bootstrap.**
