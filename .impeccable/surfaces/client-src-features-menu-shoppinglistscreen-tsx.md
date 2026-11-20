---
version: 1
slug: "client-src-features-menu-shoppinglistscreen-tsx"
primary_target: "client/src/features/menu/ShoppingListScreen.tsx"
related_targets: ["client/src/features/navigation/EditorScreen.tsx"]
---

# Shopping previews and editors

Mode: Operate. Approved interactive reference: `.impeccable/mocks/shopping-navigation.html`, Single preview, desktop and mobile.

## Direction contract

THESIS: Preserve the quick ingredient-to-meal glance in one preview; recipes and ingredients get dedicated editor pages with direct contextual entry.

OWN-WORLD: Inherit Comal's clay action color, cream surfaces, Fraunces headings, DM Sans controls, receipt monospace, and Greda primitives. Preserve the original header Menu popover and floating mobile bottom navigation; the user requested reverting the navbar implementation.

STORY: Shopping ingredient opens this week's usage; selecting a meal replaces the preview contents. Back returns to usage; Close returns to shopping. Edit opens a page; Save or Cancel returns to the originating preview or library.

FIRST VIEWPORT: Existing shopping receipt stays the primary surface. One compact centered desktop modal or mobile bottom sheet presents usage and a secondary Edit ingredient action. Editor back links, headings, forms, and supporting messages use the shared centered page container without an additional editor-specific width limit, with clear form groups and wrapping footer actions.

FORM: seed: none (pinned). User selected Single preview; subsequently requested reverting the navbar changes.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Boundaries and acceptance

Client-only; retain the API contract and existing identity. Preserve mounted shopping progress, unfinished people input, library filters, selected saved week, and return scroll during editor visits. Uncheck changed quantities while retaining unchanged checks. Protect dirty forms during navigation. Direct editor URLs support loading, errors, retry, and missing items. URL previews support browser Back and Forward. Use existing translations and add English/Spanish labels together.

The production build and browser-test TypeScript checks passed before committing. Automated tests were explicitly skipped at the user's request; rendered browser review remains pending. No new raster assets or design-system replacement.

## Sunday supermarket refinement

Approved use: phone checklist at the supermarket; a check means the item is in
the cart. Preserve the receipt and existing one/two/three-column breakpoints,
including three desktop columns. Keep the header compact, place serving controls
behind Adjust, keep progress visible while scrolling, and provide comfortable
checkbox touch targets. Checked rows stay in place; checks persist per menu on
this device, with changed quantities unchecked. No pantry workflow is included.

Implementation and regression coverage updated. Code and diff reviewed. The
commit request authorized full client verification: `npm run build`,
`npx tsc -p tsconfig.tests.json`, and `npm run test:browser -- --workers=1` passed
(154 browser tests across desktop, tablet, and mobile Chromium). The build
reported a bundle-size warning. Browser coverage uses mocked API responses;
Rails integration, offline PWA behavior, and a separate visual review remain
outside this verification.
