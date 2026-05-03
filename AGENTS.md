# AI Agent Onboarding Guide

This file is the first-stop context for AI coding agents and new contributors.

## Mission

Build and maintain a clear, accurate, and playable Infinity: Mercenaries rules site using Astro.

## Stack and Structure

- Framework: Astro
- Language: TypeScript + TSX + Astro + MDX
- Styling: Global CSS in `src/styles/global.css`
- Content source: `src/content/**`
- Data source: `src/data/**`
- UI components: `src/components/**`
- Pages/routes: `src/pages/**`

## Start Here Before Coding

1. Read `README.md` for run/build basics.
2. Read `docs/PROJECT_TRACKER.md` to see current priorities and ownership.
3. Read `docs/STORIES.md` and pick one story marked `Ready`.
4. Check for overlapping work before editing shared files.

## Working Agreements for AI Agents

1. Make the smallest change that completes the selected story.
2. Do not mix unrelated refactors into story work.
3. Keep content accuracy and rules clarity higher priority than visual polish.
4. Prefer updating existing patterns instead of inventing new architecture.
5. If data and UI conflict, fix data source first, then UI rendering.
6. Add or update tests when logic is changed.
7. Leave a concise entry in `docs/PROJECT_TRACKER.md` under Change Log after finishing.

## Story Workflow

1. Move a story from `Ready` to `In Progress` in `docs/STORIES.md` and assign owner.
2. Implement code changes on a branch.
3. Run quality checks.
4. Move story to `Done` with acceptance notes.
5. Update `docs/PROJECT_TRACKER.md` (Done and Next Up sections).

## Definition of Done

A story is done only when all are true:

1. Acceptance criteria in the story are met.
2. Build and tests pass locally.
3. No obvious regression in related routes/components.
4. Story status is updated in `docs/STORIES.md`.
5. `docs/PROJECT_TRACKER.md` has a one-line change summary.

## Common Commands

```bash
npm install
npm run dev
npm run build
npm run test
```

## Coordination Rules to Avoid Merge Collisions

1. One owner per story at a time.
2. Avoid touching another active story's files unless coordinated in story notes.
3. Prefer short-lived branches and small PRs.
4. If a shared file must be touched by multiple stories, sequence merges and rebase often.

## High-Risk Areas

1. `src/data/**` values that drive multiple pages and calculators.
2. Shared UI components used across routes.
3. Route-level content rendering in `src/pages/rules/**`.
4. Deployment configuration (`astro.config.mjs`, package scripts, Cloudflare config files).

## If Context Is Missing

When requirements are ambiguous, pause and propose assumptions in story notes before coding.
