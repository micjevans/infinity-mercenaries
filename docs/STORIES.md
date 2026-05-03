# Stories Backlog

Last updated: 2026-05-03

## Status Legend

- `Ready`: can be picked up now
- `In Progress`: currently owned
- `Blocked`: waiting on decision/dependency
- `Done`: completed and verified

## Story Template

Copy this template for new stories:

```md
## ST-XXX: Short Title

- Status: Ready
- Owner: Unassigned
- Priority: High | Medium | Low
- Estimate: S | M | L

### Problem

What user/developer problem are we solving?

### Scope

- In scope:
- Out of scope:

### Acceptance Criteria

1. ...
2. ...
3. ...

### Technical Notes

- Key files:
- Risks:

### Test Notes

- Manual:
- Automated:
```

## Ready

## ST-001: Local Dev Script and Docs Reliability

- Status: Ready
- Owner: Unassigned
- Priority: High
- Estimate: S

### Problem

New contributors need a trusted local setup path and run/test checklist.

### Scope

- In scope: verify scripts in `package.json`, document exact workflow in `README.md`.
- Out of scope: CI pipeline changes.

### Acceptance Criteria

1. `README.md` includes install, dev, build, and test commands that work as written.
2. Any broken or missing scripts are fixed in `package.json`.
3. A short troubleshooting section is added for common startup issues.

### Technical Notes

- Key files: `README.md`, `package.json`
- Risks: command drift if scripts are changed later without docs update.

### Test Notes

- Manual: run each documented command once.
- Automated: n/a.

## ST-002: Navigation Audit for Rules and Contracts

- Status: Ready
- Owner: Unassigned
- Priority: High
- Estimate: M

### Problem

As content grows, users need predictable navigation across rules/contracts pages.

### Scope

- In scope: audit existing route index pages and add missing links/groupings.
- Out of scope: major visual redesign.

### Acceptance Criteria

1. Every published rules/contracts page is reachable through in-app navigation.
2. Index pages are grouped logically with consistent naming.
3. Broken or stale links are removed.

### Technical Notes

- Key files: `src/pages/rules/**`, `src/pages/contracts/**`, related components.
- Risks: accidental link regressions while reorganizing.

### Test Notes

- Manual: click-through check from index pages.
- Automated: optional link-check script if available.

## ST-003: Data Integrity Pass for Reference Datasets

- Status: Ready
- Owner: Unassigned
- Priority: High
- Estimate: M

### Problem

Reference tools depend on consistent dataset shapes and values.

### Scope

- In scope: validate key data files for schema consistency and obvious duplicate/missing entries.
- Out of scope: full data model redesign.

### Acceptance Criteria

1. Audit completed for `src/data/classifieds.ts`, `src/data/companyTypes.ts`, `src/data/loot.ts`, `src/data/perks.ts`.
2. Any discovered inconsistencies are fixed or documented as follow-up stories.
3. At least one lightweight validation test is added for critical structures.

### Technical Notes

- Key files: `src/data/**`, test files under project test conventions.
- Risks: changing values that are intentionally non-uniform.

### Test Notes

- Manual: spot-check key pages fed by each dataset.
- Automated: run test command after adding validation test(s).

## ST-004: Company Manager UX Stabilization

- Status: Ready
- Owner: Unassigned
- Priority: Medium
- Estimate: L

### Problem

Company creation/management flow can be hard to follow for new users.

### Scope

- In scope: improve clarity, state transitions, and error messaging in company manager flow.
- Out of scope: net-new game mechanics.

### Acceptance Criteria

1. Main flow in company creation is understandable without external explanation.
2. Validation and errors are surfaced near relevant fields/actions.
3. No regressions in existing saved/loaded state handling.

### Technical Notes

- Key files: `src/components/CompanyManager.tsx`, `src/components/CreateCompanyWizard.tsx`, related step components.
- Risks: logic coupling across wizard steps.

### Test Notes

- Manual: complete happy-path and at least two invalid-input paths.
- Automated: add focused logic tests where feasible.

## ST-005: Responsive Pass for Core Reference Components

- Status: Ready
- Owner: Unassigned
- Priority: Medium
- Estimate: M

### Problem

Rules/reference components need consistent readability on smaller screens.

### Scope

- In scope: mobile/tablet adjustments for top-used reference components.
- Out of scope: full-site restyling.

### Acceptance Criteria

1. Key reference components avoid horizontal overflow at common mobile widths.
2. Typography and spacing remain readable on mobile.
3. Desktop layout behavior remains stable.

### Technical Notes

- Key files: `src/styles/global.css`, high-traffic components under `src/components/**`.
- Risks: CSS regressions across unrelated components.

### Test Notes

- Manual: test at 360px, 768px, and desktop widths.
- Automated: n/a.

## In Progress

None.

## Blocked

None.

## Done

None.
