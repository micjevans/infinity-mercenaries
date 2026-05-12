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

- 2026-05-11: Added the original Orbit pie-menu demo CSS and click handler to `/orbit-test/` so the raw pasted HTML can reveal its option, active, and suboption rings.
- 2026-05-11: Replaced `/orbit-test/` with the raw Orbit pie-menu example markup plus only a minimal page wrapper and `handleClick` shim to isolate package behavior from custom implementation choices.
- 2026-05-11: Simplified `/orbit-test/` into a focused Orbit pie-menu baseline with six radial slices, label capsules, a center control, and a linked readout instead of trying to recreate the full contracts selector immediately.
- 2026-05-11: Rebuilt the `/orbit-test/` prototype around Orbit's documented `bigbang > gravity-spot > orbit-* > satellite/vector/o-arc` hierarchy, removed the invalid direct satellite child that triggered Orbit warning rings, and stabilized sizing with CSS force clamps instead of full-width Orbit resize scaling.
- 2026-05-11: Installed `@zumer/orbit` and added a standalone `/orbit-test/` prototype that uses Orbit CSS/custom elements for radial contract placement while preserving the existing production wheels.
- 2026-05-11: Cleaned the landing wheel center down to the Infinity mark only and changed expanded navigation readouts to sit beside the shifted wheel on desktop while retaining the bottom stack on narrow screens.
- 2026-05-11: Restored the landing selector's routed signal/readout reveal animation, made the main wheel scroll/click/keyboard-rotatable, added a rules orbit, and reused the mission readout panel for Companies and Events popouts.
- 2026-05-11: Simplified the entry console by hiding the footer, removing the large landing wordmark/subtitle block, and rendering the Infinity mark as the primary wheel's center node.
- 2026-05-11: Converted the landing page into a headerless Mercnet navigation console where selecting Contracts opens a second concentric contract selector orbit with scroll/keyboard focus and an inline mission readout.
- 2026-05-11: Extracted the rotary hologram wheel into a reusable Astro component and switched both the contracts selector and landing navigation to share the same generated ring geometry with select/link behavior.
- 2026-05-11: Simplified the landing page by removing the Open Channels resource hub and replacing the primary section links with a compact holographic navigation wheel.
- 2026-05-11: Anchored the contracts hologram signal to the measured bottom-center of the wheel and changed the readout reveal into a split-line curtain that opens vertically with the panel frame.
- 2026-05-11: Rebuilt the contracts hologram connector as bottom-origin CSS trace segments and changed the mission readout reveal to grow from a full-width center scanline into the final panel.
- 2026-05-11: Simplified the contracts hologram readout animation after visual review by removing internal bracket traces, placing the panel above the connector, and preventing signal lines from crossing the mission copy.
- 2026-05-11: Fixed the contracts hologram reveal by removing fragmented dashed SVG frame pieces, drawing one solid routed connector, and making the mission panel itself collapse and reform before readout text appears.
- 2026-05-11: Added a staged contracts hologram selection animation where the signal route draws from the dial, opens the mission readout frame, and boots the readout copy in a fast terminal reveal.
- 2026-05-11: Replaced the contracts hologram connector bracket with an SVG-routed signal path from the lower dial to the mission readout and reduced readout title sizing so long contract names fit.
- 2026-05-11: Removed the browser focus outline from contracts hologram SVG labels and rerouted the mission selector connector into a bent trace from the lower dial toward the readout panel.
- 2026-05-11: Streamlined the contracts index into the hologram-only selector by removing the separate page hero and fallback grid, promoting the inner orbit copy to the page title, and simplifying wheel labels to contract names.
- 2026-05-11: Made the contracts hologram arc labels the actual selector controls, removed the target-locked readout and selected-label highlight, and moved the connector signal into the layout between the dial and mission readout.
- 2026-05-11: Brightened contracts hologram arc text to glowing cyan, removed the active contract's duplicate curved label text, and added a signal connector from the dial into the mission selector readout.
- 2026-05-11: Rebuilt the contracts hologram orbit labels as SVG arc bands with textPath labels so the contract names visibly curve around the circular selector while preserving invisible hit targets for interaction.
- 2026-05-11: Changed the contracts hologram labels to rotate tangentially with the circular dial so the bottom focused label stays readable while upper labels wrap around the display.
- 2026-05-11: Softened the contracts hologram orbit labels into lighter terminal slats with wider active labels, reduced truncation, subtler spokes, and less vertical dead space around the selector.
- 2026-05-11: Refined the contracts hologram selector with alternating inner/outer label bands, radial connector spokes, softer translucent callout tabs, active spoke highlighting, and slight label canting to better integrate options with the circular display.
- 2026-05-11: Added an experimental contracts hologram wheel with SVG concentric rings, scroll/click/keyboard rotation, active mission readout, and the existing contract grid retained as an archive fallback.

- 2026-05-10: Removed the experimental landing hero artwork layer while keeping the custom SVG wordmark and title-screen composition.
- 2026-05-10: Tuned the landing hero artwork to render more clearly with a transparency vignette and lighter scanline/overlay treatment instead of heavy cyan blend filtering.
- 2026-05-10: Reworked the landing entry screen with a blended coolmixedheroes visual layer and a custom SVG wordmark treatment so the first viewport feels closer to an ARWES-style sci-fi title screen.
- 2026-05-10: Moved rules/contracts index grid cards onto the clipped backplate frame pattern so their chamfered borders match the fixed company and event list shells.
- 2026-05-10: Replaced company and event list chamfer outlines with clipped backplate frames so diagonal edges render as real continuous borders instead of pseudo-outline artifacts.
- 2026-05-10: Reworked company chamfer frames from clipped rectangular masks to explicit edge gradients so the diagonal cuts draw at the same strength as the straight edges.
- 2026-05-10: Hardened company page chamfer outlines at the CSS module level so native clipped borders no longer fade out on diagonal edges.
- 2026-05-10: Replaced clipped-panel native borders with a subtle masked outline layer so chamfered edges render with the same opacity as straight frame edges without bringing back highlighted corner ticks.
- 2026-05-10: Added a global no-corner-ticks pass that disables bright HUD corner strokes and boot corner outlines across shared panels, cards, buttons, and legacy module surfaces while preserving glass fills and borders.
- 2026-05-10: Added a frame restraint pass that removes heavy HUD corner ticks from dense dashboard/readout elements while preserving stronger framing for major panels and cards.
- 2026-05-10: Consolidated the signed-in header auth area into one Drive-linked status trigger with a compact profile/sign-out dropdown, keeping the command rail lighter and less button-heavy.
- 2026-05-10: Slimmed the header auth controls into one-line sync/status actions and removed the Discord icon's external-link marker so the header reads as one consistent command rail.
- 2026-05-10: Simplified the global header navigation to core app routes and converted the Discord link into an ARWES-style icon-only social control using the reference SVG path.
- 2026-05-10: Removed duplicate legacy corner overlays and transparentized clipped borders on shared HUD cards so downtime/rules frames no longer show offset double chamfers.
- 2026-05-10: Tightened HUD chamfer corner joins by overlapping diagonal and straight frame strokes so top-left and bottom-right corners render as continuous lines without faint stepped gaps.
- 2026-05-10: Added an ARWES restraint pass with line-driven header navigation, a quieter rules/contracts document frame, rail-style callouts, lighter separated table rows, and subtler localized panel illumination.
- 2026-05-10: Strengthened HUD frame corner rendering by replacing faint 1px split-corner gradients with joined 2px corner strokes and explicit chamfer diagonals across cards, panels, CTAs, and event module frames.
- 2026-05-10: Removed remaining legacy warm color literals from CSS modules and shared styles, retheming company manager accordions, unit profile accordions, event tools, and pairing surfaces to cyan HUD panels with lime signal accents.
- 2026-05-10: Added a warm-color quarantine pass that rethemes twist tables, company legacy panels/profile sheets, event cards, and pairing surfaces away from brown/amber panels into cyan HUD frames with lime signal accents.
- 2026-05-10: Added a shared boot image materialization animation so visible page images reveal from noisy blurred fragments into crisp artwork while preserving decorative/header logos.
- 2026-05-09: Restyled the Google auth header control into compact sci-fi command/status chips with Drive-linked state, leading status light, matching nav hover motion, and corrected CSS module class bindings.
- 2026-05-11: Rebuilt `/orbit-test/` as a closer Orbit-package conversion of the original hologram wheel, mapping old SVG rings/text/spokes to `o-arc` curved text, segmented arcs, vectors, satellites, and capsules from the local Orbit docs reference.
- 2026-05-11: Added a stronger Orbit-package visual pass to `/orbit-test/` with larger radial composition, layered Orbit arcs, tick satellites, a connector beam, and a themed HUD command button.
- 2026-05-11: Cleaned up `/orbit-test/` visual composition by removing inherited shell styling from the wrapper, tightening the intro copy, scaling the Orbit wheel/readout balance, and quieting the radial accents.
- 2026-05-11: Fixed the `/orbit-test/` prototype by renaming local classes that accidentally matched Orbit's broad `[class*=orbit-]` selectors, stopping the package from treating wrapper elements as radial orbits.
- 2026-05-11: Reworked `/orbit-test/` from the raw Orbit pie-menu reference into a basic Mercnet navigation prototype with four selectable arc controls, satellite labels, active wedge feedback, and a linked readout panel.
- 2026-05-09: Fixed rules/contracts index grid flash by scoping the index-list opacity override to revealed lists instead of forcing them visible before boot animations attach.
- 2026-05-09: Added a first-paint boot preparation state so animated page content starts transparent before JavaScript attaches boot attributes, preventing the brief pre-animation flash.
- 2026-05-09: Reserved measured text dimensions during typewriter boot animations so content remains invisible-but-present and avoids layout jumping while it types in.
- 2026-05-09: Matched each leading backplane packet offset to its route's animated trace length so the front marker lines up with short and long signal dashes.
- 2026-05-09: Added a smaller leading packet to each animated backplane signal so the glowing trace has a visible front marker while preserving the normalized trace speed.
- 2026-05-09: Nudged animated backplane trace travel closer to packet speed so the glowing pre-line no longer pulls ahead on wider screens.
- 2026-05-09: Removed non-scaling stroke behavior from animated backplane signal dashes so dash length scales with the SVG path and stays synchronized with packets on larger screens.
- 2026-05-09: Tuned backplane signal dash offset speed after visual review so the tracing line stays closer to packet movement without outrunning it across long routes.
- 2026-05-09: Synchronized backplane signal dash speed with packet motion by matching dash pattern totals and dash offset travel to the normalized motion path length.
- 2026-05-09: Changed animated backplane routes into short glowing signal dashes synchronized with packets so paths appear just ahead of movement and disappear after the packet passes.
- 2026-05-09: Rebuilt the animated backplane grid inside the SVG so dots align to circuit corners, packet paths travel from off-canvas to off-canvas, and trace routes mostly follow horizontal/vertical grid lines with occasional diagonal reroutes.
- 2026-05-09: Reduced animated backplane clutter by simplifying circuit paths, aligning node dots to the route grid, removing mirrored trace overlap, and quieting the landing orbital/grid substrate while preserving packet motion.
- 2026-05-09: Redesigned the landing page into a simple ARWES-inspired entry console with centered brand signal, primary navigation links, restrained orbital/nebula motion, and a compact resource dock.
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
