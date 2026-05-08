# CSS Refactor Plan for Astro + React Project

## Purpose

This document is an implementation plan for refactoring a large CSS file in a new Astro + React project. The current stylesheet is approximately 11,000 lines long. The goal is not to redesign the application from scratch. The goal is to reorganize, simplify, and make the CSS architecture maintainable while preserving the current visual direction as much as practical.

The app is still fairly new, so we do **not** need a heavy visual regression or screenshot-freezing process before refactoring. However, avoid unnecessary visual changes unless they clearly improve consistency or reduce obvious CSS problems.

---

## Primary Goals

1. Break the single large CSS file into a maintainable folder structure.
2. Separate global styles, design tokens, layout styles, reusable component styles, page styles, utilities, and temporary legacy styles.
3. Reduce duplication across common UI patterns such as buttons, cards, forms, panels, badges, navigation, and tables.
4. Introduce or consolidate CSS custom properties for colors, spacing, typography, shadows, radii, transitions, and z-index values.
5. Reduce specificity problems, deeply nested selectors, and unnecessary `!important` usage.
6. Move React-component-specific styles into CSS Modules where appropriate.
7. Use Astro scoped styles for Astro-only page sections where appropriate.
8. Leave the project in a state where future CSS has an obvious place to live.

---

## Non-Goals

Do **not** treat this as a full redesign.

Do **not** convert the entire project to a new styling framework.

Do **not** introduce Material UI.

Do **not** introduce Tailwind unless explicitly requested later.

Do **not** rewrite every class name just for style purity.

Do **not** spend excessive time perfecting old or low-impact CSS. If a style works and is not actively causing problems, it can temporarily remain in `legacy.css`.

Do **not** remove CSS that may be used dynamically without first checking usage patterns in Astro, React, and JavaScript/TypeScript files.

---

## Important Context

This is an Astro + React project. Use that architecture when deciding where CSS should live.

Recommended styling approach:

- Global CSS for app-wide foundations and reusable primitives.
- Astro scoped styles for static page sections or Astro-only components.
- CSS Modules for React component-specific styles.
- A temporary `legacy.css` file for styles that have not yet been sorted.

The desired result should feel like a custom sci-fi/cyberpunk game application rather than a generic enterprise dashboard.

---

## Proposed Final Folder Structure

Create or migrate toward this structure:

```txt
src/
  styles/
    index.css

    foundation/
      tokens.css
      reset.css
      base.css
      typography.css
      animations.css

    layout/
      shell.css
      containers.css
      grid.css
      stack.css

    components/
      button.css
      card.css
      panel.css
      form.css
      input.css
      modal.css
      nav.css
      table.css
      badge.css
      tooltip.css

    utilities/
      display.css
      spacing.css
      text.css
      accessibility.css

    pages/
      home.css
      dashboard.css
      company.css
      unit-editor.css
      rules.css

    legacy.css
```

Adjust page/component filenames to match the actual project. Do not create empty files unless they are needed or useful as near-term destinations.

---

## Main CSS Entry File

The main stylesheet should become `src/styles/index.css`.

Recommended import structure:

```css
@layer reset, tokens, base, typography, layout, components, utilities, pages, legacy, overrides;

@import "./foundation/tokens.css";
@import "./foundation/reset.css";
@import "./foundation/base.css";
@import "./foundation/typography.css";
@import "./foundation/animations.css";

@import "./layout/shell.css";
@import "./layout/containers.css";
@import "./layout/grid.css";
@import "./layout/stack.css";

@import "./components/button.css";
@import "./components/card.css";
@import "./components/panel.css";
@import "./components/form.css";
@import "./components/input.css";
@import "./components/modal.css";
@import "./components/nav.css";
@import "./components/table.css";
@import "./components/badge.css";
@import "./components/tooltip.css";

@import "./utilities/display.css";
@import "./utilities/spacing.css";
@import "./utilities/text.css";
@import "./utilities/accessibility.css";

@import "./pages/home.css";
@import "./pages/dashboard.css";
@import "./pages/company.css";
@import "./pages/unit-editor.css";
@import "./pages/rules.css";

@import "./legacy.css";
```

If cascade layers cause unexpected behavior due to existing import order or browser/build constraints, use the folder structure first and defer layers. However, cascade layers are recommended if they can be adopted safely.

---

## Recommended Cascade Layer Usage

Use layers to control override order and reduce specificity wars.

Suggested layer order:

```css
@layer reset, tokens, base, typography, layout, components, utilities, pages, legacy, overrides;
```

Examples:

```css
@layer components {
  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}
```

```css
@layer utilities {
  .u-hidden {
    display: none !important;
  }
}
```

Use `!important` sparingly. It is acceptable for explicit override utilities such as `.u-hidden`, but should generally be removed from component styles where possible.

---

## Phase 1: Establish the Refactor Shell

### Objective

Create the new CSS architecture without changing behavior more than necessary.

### Tasks

1. Create `src/styles/index.css`.
2. Move the current 11,000-line stylesheet into `src/styles/legacy.css`.
3. Import `legacy.css` from `index.css`.
4. Make sure the app imports `src/styles/index.css` instead of the old stylesheet.
5. Run the app and confirm the styling still loads.

### Acceptance Criteria

- The old CSS is no longer sitting as one giant primary entry file.
- The app uses `src/styles/index.css` as the main CSS entry point.
- `legacy.css` contains the existing styles unchanged or nearly unchanged.
- The app still renders with the current visual style.

---

#### ✅ Phase 1 Complete (2026-05-07)

- Created `src/styles/index.css` as main entry point
- Moved all global.css content to legacy.css (except theme import)
- Updated BaseLayout.astro to import index.css
- App builds and renders correctly

#### Phase 1 Repair / Handoff Status (2026-05-08)

- `src/styles/index.css` is the active app stylesheet imported by `BaseLayout.astro`.
- `src/styles/global.css` is now only a compatibility shim that imports `index.css`; do not add new rules there.
- Remaining unsorted global rules are quarantined in `src/styles/legacy.css`.
- Standalone contract embed routes now import `index.css` directly and use the control panel theme body class.
- The app builds successfully after the repair.
- Important follow-up: `legacy.css` is still large and should continue shrinking as selectors are migrated into the existing foundation/layout/component/page/module files.

#### Phase 2-10 Completion Pass (2026-05-08)

- `legacy.css` has been drained down to a temporary marker only.
- Foundation ownership now includes app base styling plus `foundation/control-panel.css` for the sci-fi theme sweep.
- Page ownership is split across `pages/home.css`, `pages/rules.css`, `pages/company.css`, `pages/events.css`, and `pages/pairing.css`.
- Reusable form/custom-select and sponsor card styles moved into component/page-owned files instead of legacy.
- React component CSS Modules are present for the active TSX-heavy components touched by the refactor.
- Added `src/pages/styleguide.astro` as an internal reference for buttons, cards, panels, forms, and tables.
- Build and test validation passed after this completion pass.
- Remaining cleanup is optional polish: refine the broad page files into smaller component files over time, and visually QA routes in-browser before a final merge.

---

## Phase 2: Create Foundation Files

### Objective

Extract global foundation styles from `legacy.css` into dedicated files.

### Files

```txt
src/styles/foundation/tokens.css
src/styles/foundation/reset.css
src/styles/foundation/base.css
src/styles/foundation/typography.css
src/styles/foundation/animations.css
```

### Move These Styles

Move the following out of `legacy.css` when found:

- `:root` variables
- global color variables
- font variables
- spacing variables
- shadow variables
- border radius variables
- transition variables
- z-index variables
- `html`, `body`, `*`, `*::before`, `*::after`
- heading defaults
- paragraph defaults
- link defaults
- global font smoothing
- global box sizing
- keyframes and reusable animations

### Token Guidelines

Prefer broad, reusable tokens first.

Good examples:

```css
:root {
  --color-bg: #080b10;
  --color-surface: #111827;
  --color-surface-raised: #1f2937;
  --color-text: #f9fafb;
  --color-text-muted: #9ca3af;
  --color-accent: #f5b942;
  --color-danger: #ef4444;
  --color-success: #22c55e;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;

  --shadow-panel: 0 12px 30px rgb(0 0 0 / 0.35);

  --font-body: system-ui, sans-serif;
  --font-display: "Rajdhani", "Orbitron", system-ui, sans-serif;
}
```

Avoid extremely specific tokens unless the same value is reused meaningfully.

Avoid this kind of token unless there is a clear reason:

```css
--button-primary-hover-border-left-color-active: #f5b942;
```

### Acceptance Criteria

- Basic app-wide styling is separated from legacy CSS.
- Design variables are centralized in `tokens.css`.
- Global element styles are centralized in foundation files.
- `legacy.css` is smaller.

---

## Phase 3: Extract Layout Styles

### Objective

Move app shell and reusable layout patterns out of `legacy.css`.

### Files

```txt
src/styles/layout/shell.css
src/styles/layout/containers.css
src/styles/layout/grid.css
src/styles/layout/stack.css
```

### Move These Styles

Look for styles related to:

- app shell
- page wrappers
- main content areas
- sidebars
- headers/footers at the layout level
- reusable containers
- grid systems
- flex rows/clusters
- vertical stacks
- responsive layout primitives

### Naming Guidance

Prefer reusable names for reusable layout styles:

```css
.app-shell {
}
.page-shell {
}
.container {
}
.container--narrow {
}
.container--wide {
}
.stack {
}
.cluster {
}
.grid {
}
```

Avoid names that imply a component when the style is actually layout-level.

### Acceptance Criteria

- Reusable layout CSS is no longer mixed with component or page CSS.
- Layout classes are reasonably generic and reusable.
- App/page shell styles are easy to find.

---

## Phase 4: Extract Reusable Component Styles

### Objective

Consolidate repeated UI patterns into reusable global component CSS.

### Files

```txt
src/styles/components/button.css
src/styles/components/card.css
src/styles/components/panel.css
src/styles/components/form.css
src/styles/components/input.css
src/styles/components/modal.css
src/styles/components/nav.css
src/styles/components/table.css
src/styles/components/badge.css
src/styles/components/tooltip.css
```

### Components to Prioritize

Start with the most duplicated/common patterns:

1. Buttons
2. Cards
3. Panels
4. Inputs and forms
5. Badges/status pills
6. Navigation
7. Tables/lists
8. Modals/dialogs

### Consolidation Examples

If the CSS currently has several button-like classes such as:

```css
.btn {
}
.button {
}
.primary-button {
}
.action-btn {
}
.ctaButton {
}
```

Migrate toward a single system:

```css
.button {
}
.button--primary {
}
.button--secondary {
}
.button--ghost {
}
.button--danger {
}
.button--small {
}
.button--large {
}
```

For cards/panels:

```css
.card {
}
.card__header {
}
.card__body {
}
.card__footer {
}
.card--interactive {
}
.card--selected {
}

.panel {
}
.panel__title {
}
.panel__content {
}
```

For badges:

```css
.badge {
}
.badge--success {
}
.badge--warning {
}
.badge--danger {
}
.badge--neutral {
}
```

### Migration Strategy

Do not rename every class at once if that creates too much risk.

It is acceptable to temporarily support old and new selectors together:

```css
.button,
.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.button--primary,
.primary-button {
  background: var(--color-accent);
}
```

Add comments for deprecated selectors when helpful:

```css
/* Deprecated: use .button .button--primary instead. */
```

### Acceptance Criteria

- Common UI components have clear global CSS files.
- Duplicate button/card/form/badge styles are reduced.
- Deprecated class names are clearly marked where retained.
- New component styles use design tokens where practical.

---

## Phase 5: Extract Utility Classes

### Objective

Move true utility classes into dedicated files.

### Files

```txt
src/styles/utilities/display.css
src/styles/utilities/spacing.css
src/styles/utilities/text.css
src/styles/utilities/accessibility.css
```

### Utility Naming

Use a `u-` prefix so utilities are easy to identify.

Examples:

```css
.u-hidden {
}
.u-sr-only {
}
.u-text-muted {
}
.u-text-accent {
}
.u-stack-sm {
}
.u-stack-md {
}
.u-cluster {
}
.u-center {
}
```

### Important Usage Rule

Utilities should be small, predictable, and single-purpose.

Good:

```css
.u-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

Avoid utility classes that are secretly full components.

Bad:

```css
.u-special-card-layout-with-header-and-glow {
}
```

That belongs in a component or page stylesheet.

### Acceptance Criteria

- Accessibility utilities are easy to find.
- Text/display/spacing helpers are separated from component CSS.
- Utilities are not used as a dumping ground for random styles.

---

## Phase 6: Extract Page-Specific Styles

### Objective

Move styles that only apply to one page or route into page-specific CSS files.

### Files

Examples:

```txt
src/styles/pages/home.css
src/styles/pages/dashboard.css
src/styles/pages/company.css
src/styles/pages/unit-editor.css
src/styles/pages/rules.css
```

Adjust names based on the actual app routes.

### Move These Styles

Move selectors that are clearly tied to specific pages, such as:

```css
.home-hero {
}
.home-sponsor-grid {
}
.dashboard-shell {
}
.company-list {
}
.unit-editor {
}
.rules-layout {
}
```

### Naming Guidance

Use page prefixes to make ownership obvious:

```css
.home-hero {
}
.home-feature-card {
}
.company-list {
}
.company-list__header {
}
.unit-editor {
}
.unit-editor__panel {
}
```

### Astro Alternative

If a page section exists only inside one Astro file, consider moving its styles into that `.astro` file using scoped styles.

Good candidate:

```astro
<section class="home-hero">
  ...
</section>

<style>
  .home-hero {
    ...
  }
</style>
```

Use this for static page sections where scoped ownership is clearer than global page CSS.

### Acceptance Criteria

- Page-specific selectors are no longer mixed into global component CSS.
- Route/page styles are easy to locate.
- Astro-only page sections may use scoped Astro styles where that improves ownership.

---

## Phase 7: Move React Component Styles to CSS Modules

### Objective

Reduce global CSS pollution by colocating React-component-specific styles with their components.

### Recommended Pattern

For React components with styles only used by that component, create CSS Modules:

```txt
src/components/UnitCard/
  UnitCard.tsx
  UnitCard.module.css
```

Usage:

```tsx
import styles from "./UnitCard.module.css";

export function UnitCard() {
  return <article className={styles.unitCard}>...</article>;
}
```

### Hybrid Pattern

Use global primitives plus component module classes where useful:

```tsx
<article className={`card ${styles.unitCard}`}>...</article>
```

In this pattern:

- `card` provides shared reusable card styling.
- `styles.unitCard` handles local layout or component-specific details.

### Good CSS Module Candidates

Move styles to CSS Modules when:

- the selector is only used by one React component
- the selector depends on component structure
- the selector has a component-specific name
- the style would be risky as a global class

Examples:

```css
.unitCard {
}
.unitCardHeader {
}
.statGrid {
}
.weaponRow {
}
```

### Keep Global Instead When

Keep styles global when they are true reusable primitives:

```css
.button {
}
.card {
}
.badge {
}
.input {
}
.panel {
}
```

### Acceptance Criteria

- React-only styles are no longer all global.
- CSS Modules are used for component-specific styling.
- Reusable primitives remain global.
- Component files become easier to understand because local styles live nearby.

---

## Phase 8: Reduce Specificity and Remove CSS Smells

### Objective

Simplify selectors and remove unnecessary override hacks.

### Find and Review

Search for:

```txt
!important
#id selectors
selectors nested more than 3 levels deep
very long descendant selectors
duplicate selectors
large blocks of repeated declarations
hard-coded colors repeated many times
hard-coded spacing repeated many times
```

### Replace Deep Selectors

Avoid selectors like:

```css
.app main .sidebar .menu li a.active span {
  color: yellow;
}
```

Prefer direct class ownership:

```css
.menu-link--active {
  color: var(--color-accent);
}
```

Or, in CSS Modules:

```css
.menuLinkActive {
  color: var(--color-accent);
}
```

### `!important` Policy

Allowed in rare cases:

```css
.u-hidden {
  display: none !important;
}
```

Avoid in component styles:

```css
.card-title {
  color: red !important;
}
```

If `!important` is required because of CSS order, fix the import order or layer order instead.

If `!important` is required because another selector is too specific, reduce the other selector.

### Acceptance Criteria

- Fewer deeply nested selectors.
- Fewer unnecessary `!important` rules.
- Fewer hard-coded repeated values.
- Component selectors are simpler and easier to override safely.

---

## Phase 9: Remove Dead or Duplicated CSS Carefully

### Objective

Remove unused styles without breaking dynamic class usage.

### Tools and Techniques

Use a combination of:

- project-wide search
- browser devtools coverage
- manual inspection
- grep/ripgrep
- awareness of dynamic class names in React/Astro

### Be Careful With Dynamic Classes

React may generate classes dynamically:

```tsx
<div className={`status-${unit.status}`} />
```

Corresponding CSS:

```css
.status-active {
}
.status-injured {
}
.status-hidden {
}
```

Do not delete these just because static search does not find exact class names.

Also check for patterns like:

```tsx
className={`${variant}-button`}
className={`faction-${factionKey}`}
className={`rarity-${rarity}`}
class:list={[`theme-${theme}`]}
```

### Suggested Safelist Patterns

Preserve or carefully review classes matching patterns like:

```txt
status-*
faction-*
rarity-*
theme-*
variant-*
```

Adjust based on the actual project.

### Acceptance Criteria

- Obvious dead CSS is removed.
- Dynamic classes are not accidentally deleted.
- Duplicated component styles are consolidated.
- `legacy.css` continues to shrink.

---

## Phase 10: Optional Style Guide Page

### Objective

Create a small internal reference page for shared UI primitives.

This is optional but recommended if the app has many reusable visual patterns.

### Possible Route

```txt
src/pages/styleguide.astro
```

### Include Examples Of

- Buttons
- Cards
- Panels
- Badges
- Inputs
- Form fields
- Tables
- Modals/dialog examples if easy
- Typography
- Color swatches
- Spacing examples

### Acceptance Criteria

- Developers can quickly see available reusable styles.
- New UI work has a clear visual reference.
- The style guide reflects actual project CSS, not a separate design fantasy.

---

## Class Naming Guidelines

### Global Component Classes

Use BEM-ish naming:

```css
.card {
}
.card__header {
}
.card__body {
}
.card__footer {
}
.card--interactive {
}
.card--selected {
}

.button {
}
.button--primary {
}
.button--secondary {
}
.button--ghost {
}
.button--danger {
}
```

### Page Classes

Prefix with the page or route name:

```css
.home-hero {
}
.home-sponsor-grid {
}
.company-list {
}
.company-list__header {
}
.unit-editor {
}
.unit-editor__panel {
}
```

### Utility Classes

Use `u-` prefix:

```css
.u-hidden {
}
.u-sr-only {
}
.u-text-muted {
}
.u-stack-md {
}
```

### CSS Modules

Use readable local names:

```css
.unitCard {
}
.unitHeader {
}
.statGrid {
}
.weaponRow {
}
```

Avoid generic local names that make the component hard to read:

```css
.wrapper {
}
.inner {
}
.thing {
}
```

These are acceptable only when the component is very small and obvious.

---

## Suggested Implementation Order

Use this exact order unless the codebase strongly suggests a better path.

1. Create `index.css` and `legacy.css`.
2. Move existing CSS into `legacy.css` unchanged.
3. Wire the app to import `index.css`.
4. Create the folder structure.
5. Extract tokens and foundation styles.
6. Extract layout styles.
7. Extract reusable component styles.
8. Extract utilities.
9. Extract page styles.
10. Move React-component-specific styles into CSS Modules.
11. Reduce specificity and remove unnecessary `!important`.
12. Remove dead CSS carefully.
13. Optionally create a style guide page.
14. Leave notes for anything intentionally left in `legacy.css`.

---

## Commit Strategy

Prefer several small commits instead of one massive commit.

Suggested commits:

1. `refactor-css-entry-and-legacy-file`
2. `extract-css-foundation-styles`
3. `extract-layout-styles`
4. `extract-shared-component-styles`
5. `extract-utility-styles`
6. `extract-page-styles`
7. `move-react-component-styles-to-modules`
8. `reduce-css-specificity-and-duplicates`
9. `remove-unused-css`

Each commit should leave the app in a runnable state.

---

## Validation Checklist

After each phase, run the project and check the most important routes/components manually.

Minimum validation:

- App starts without build errors.
- Main layout still renders.
- Navigation still looks correct.
- Buttons still look correct.
- Forms and inputs still look correct.
- Cards/panels still look correct.
- Important pages still look approximately the same.
- Responsive behavior still works at common desktop and mobile widths.
- No obvious missing styles due to import order mistakes.

Since the app is new, exact screenshot matching is not required.

---

## Final Deliverables

At the end of the refactor, provide:

1. A summary of the new CSS structure.
2. A list of major files created or changed.
3. A list of style systems consolidated, such as buttons/cards/forms.
4. A list of any intentional visual changes.
5. A list of any CSS still left in `legacy.css`.
6. Any recommended next steps.

---

## Definition of Done

The refactor is complete when:

- The project no longer depends on one giant 11,000-line stylesheet as the primary working CSS file.
- CSS is divided by clear ownership: foundation, layout, components, utilities, pages, modules, and legacy.
- Design tokens are centralized.
- Common reusable UI styles are consolidated.
- React component-specific styles are colocated in CSS Modules where appropriate.
- Astro-only page sections use scoped Astro styles where appropriate.
- `legacy.css` is significantly smaller or clearly marked as temporary.
- Future developers can tell where new styles should be added.
- The app still visually matches the current direction unless a change was intentional and documented.

## Cleanup Follow-Up Completed

- Consolidated copied button, panel/grid, card, modal, tab, badge, form, option-row, event-list, and editor-header rules into shared CSS files.
- Removed duplicate shell/navigation placeholders and empty grid placeholder rules.
- Removed the duplicate company page prelude that repeated the company manager list/detail styles.
- Verified exact duplicate selector/declaration blocks across `src/styles/**/*.css`: none remain.
- Verified `npm run build` and `npm run test` pass after the cleanup.

---

## Guiding Principle

For every selector, ask:

> Who owns this style?

The answer should determine where the style belongs:

- Whole app → foundation/base
- Theme/design language → tokens
- Reusable layout → layout
- Reusable UI pattern → global component CSS
- One page → page CSS or Astro scoped style
- One React component → CSS Module
- Temporary or unclear → legacy.css
- Nobody → delete it after verifying it is unused
