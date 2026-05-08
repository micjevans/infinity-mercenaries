# Project Tracker

Last updated: 2026-05-03

## Current Focus

Coordinate multi-contributor development using small stories, explicit ownership, and a shared status board.

## Done (Recent)

5. Shop UI upgraded with rich market cards and Base Market rule detail mapping (effects, ARM/BTS/type, and contextual armor notes) sourced from war-markets data.
6. Perk-trooper integration: `VisualPerkTree` now detects base profile skills as already-selected, and perk selections embed skill effects so `renderCombinedDetails`/`applyItemToTrooper` updates the rendered profile. Build passes.
7. Repository secret cleanup completed across key remote branches.
8. Main rules/content structure established under `src/content/rules` and `src/content/contracts`.
9. Core component library scaffolded under `src/components`.

## In Progress

1. Collaboration process setup (this tracker + story workflow).

## Next Up

1. Validate and document local development scripts and CI checks.
2. Prioritize highest-impact UX and data-consistency stories.
3. Define test strategy for calculator/manager logic in TSX components.

## Risks and Watchouts

1. Parallel edits in shared components can cause merge conflicts.
2. Data updates can silently break rendering assumptions in pages/components.
3. Route and content growth can outpace navigation/discoverability.

## Ownership Map (Initial)

Use this as a temporary map; update as team members onboard.

- Content and rules pages: Unassigned
- Data integrity and calculators: Unassigned
- UI consistency and responsive polish: Unassigned
- Build/deploy configuration: Unassigned

## Change Log

- 2026-05-08: Converted the PCB backplane from one document-stretched SVG into repeated fixed-height SVG tiles with unique motion paths so long pages keep crisp circuit proportions instead of scaling vertically.
- 2026-05-08: Narrowed boot frame construction to intentional framed controls/cards instead of layout wrappers or generic box/panel classes, slowed the draw effect, and made the temporary construction outline fade out after completing.
- 2026-05-08: Refined component boot motion with real fast typewriter text for normal page copy/titles, skipped button/dedicated-box text, and added top-left outline draw construction for buttons and panels.
- 2026-05-08: Added a global component boot animation system with automatic text scan reveals, panel/card mask-open reveals, staggered viewport activation, dynamic React mount coverage, and reduced-motion support.
- 2026-05-08: Reworked the animated backplane into a document-scrolling SVG PCB network with angled trace paths, glowing nodes, and multiple packets following circuit-like routes instead of fixed viewport gradients.
- 2026-05-08: Added an app-wide animated mainframe backplane with PCB-style trace grids, glowing nodes, and racing data packets behind the sci-fi UI, with reduced-motion support.
- 2026-05-08: Normalized sci-fi frame corners and theme colors across CTAs, feature cards, contract scoring/objective panels, deployment maps, and legacy amber surfaces so the ARWES-inspired cyan/lime system wins over older brown styling.
- 2026-05-08: Tuned base card and panel frames toward the cleaner ARWES reference with subtle glass fills, corner ticks, tighter rules index cards, compact hero scaling, and fixed rules index reveal behavior on mobile.
- 2026-05-08: Added an ARWES-inspired clean sci-fi pass with a darker starfield substrate, slimmer header/navigation, quieter glass panes, cyan/lime signal colors, and a narrower centered company list composition.
- 2026-05-08: Redesigned the global header into an integrated sci-fi command rail with active-route state, a framed brand block, responsive nav behavior, and themed auth controls.
- 2026-05-08: Rebuilt unit profile display CSS with scoped HUD headers, stat tiles, detail rows, option rows, and readable weapon profile tables.
- 2026-05-08: Reworked footer flow plus company list/manager HUD spacing so short pages anchor correctly and company surfaces use scoped cards, controls, and bounded faction imagery.
- 2026-05-08: Restored the Events list layout with centered HUD page/card/form/button styling in the EventManager CSS module and verified desktop/mobile screenshots.
- 2026-05-08: Completed CSS duplicate cleanup by consolidating repeated shared rules into component/layout/foundation styles and verifying build/test.
- 2026-05-08: Added ARWES-inspired HUD polish with stronger sci-fi tokens, angular controls/panels, responsive command navigation, and visual screenshot verification.
- 2026-05-08: Tuned rules/contracts layout spacing by widening the shell, removing the accidental full-shell glass slab, tightening contract hero/objective spacing, and checking desktop/mobile screenshots.
- 2026-05-04: Pivoted faction ETL to remote-first Corvus refresh workflow, removed legacy-default sync usage, updated npm commands/docs for local refresh + redeploy, and kept compatibility validation (`validate:factions`).
- 2026-05-03: Added initial AI onboarding and story-driven collaboration docs.
- 2026-05-03: Added one-time organizer onboarding for registration form template setup, plus Drive folder organization for events/companies/forms.
- 2026-05-03: Added shared pairing Inducements step with deployment sync/refresh gating, per-trooper inducement assignment, and mission-time inducement profile overlays stored in company event files.
- 2026-05-03: Enforced either-or company storage in UI flow by stopping drive company dual-writes into local storage and filtering drive-linked local records from the local company list.
- 2026-05-03: Added comprehensive deletion and broken link handling for companies and events. Implemented `deleteSharedFile()`, `checkSharedFileAccess()`, `removeAppDataCompanyReference()`, and `removeAppDataEventReference()` in Drive adapter. Added broken link detection and UI cleanup for both CompanyListPage and EventManager with delete buttons for Drive files and cleanup buttons for orphaned references.
- 2026-05-03: Created data abstraction layer (`companyDataLayer.ts`) to provide unified interface for reading/writing companies regardless of storage backend. Updated CompanyManager to load both local and Drive-backed companies, support `?fileId=` param for Drive companies, and use abstraction for saves. Updated DriveViewer to automatically redirect company files to CompanyManager instead of showing raw JSON. This eliminates storage differences from UI perspective - same interface for all companies.
- 2026-05-03: Fixed Drive auth/session edge case when opening companies by fileId. Added auth/client guards in Drive adapter to prevent gapi undefined and Bearer null requests, made appdata list calls fail-soft when signed out, and updated CompanyManager/data layer to load requested drive company directly without requiring appdata index.
- 2026-05-03: Evaluated and stabilized sign-in persistence. Fixed restore race that could clear valid persisted auth before gapi client readiness, added centralized auth state subscriptions in drive adapter, and replaced polling-based sign-in checks in key components (GoogleAuthButton, DriveViewer, CreateEventWizard, TestDriveClient) with subscription updates for immediate and consistent auth UI state across navigation.
- 2026-05-03: Completed app-wide auth polling removal by migrating CompanyListPage, EventManager, and PairingManager to adapter subscriptions. Added in-memory token expiry tracking for consistent sign-in state transitions and reduced cross-page auth flicker.
- 2026-05-03: Updated shared event workspace to treat event-file `registeredCompanies` as primary source (with optional form-merge refresh), and fixed pairing access checks to include Drive-owned company references from appdata so eligible users can open their pairings.
