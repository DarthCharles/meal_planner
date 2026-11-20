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

FIRST VIEWPORT: Existing shopping receipt stays the primary surface. One compact centered desktop modal or mobile bottom sheet presents usage and a secondary Edit ingredient action. Editor pages use a readable 760px content column, top Back action, clear form groups, and wrapping footer actions.

FORM: seed: none (pinned). User selected Single preview; subsequently requested reverting the navbar changes.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Boundaries and acceptance

Client-only; retain the API contract and existing identity. Preserve mounted shopping progress, unfinished people input, library filters, selected saved week, and return scroll during editor visits. Uncheck changed quantities while retaining unchanged checks. Protect dirty forms during navigation. Direct editor URLs support loading, errors, retry, and missing items. URL previews support browser Back and Forward. Use existing translations and add English/Spanish labels together.

The production build and browser-test TypeScript checks passed before committing. Automated tests were explicitly skipped at the user's request; rendered browser review remains pending. No new raster assets or design-system replacement.
