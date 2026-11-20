# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Comal is for people who experience decision paralysis when choosing what to cook
for each meal. They need help turning their recipes into a weekly plan and
knowing what to buy at the supermarket.

## Product Purpose

Reduce the recurring effort of deciding what to cook. Comal combines a weekly
menu planner, a personal recipe library, and shopping lists derived from planned
meals. Success means having a usable week of meals and knowing which ingredients
to buy.

## Operating Context

- Mobile-first responsive web app intended to be installed as a PWA, with desktop
  support.
- Supports English and Spanish. Interface translation preserves user-entered
  recipe and ingredient content.
- The core workflow is to maintain recipes, generate a weekly menu, consult the
  day's meals, and use the week's shopping list at the supermarket.
- Saved menus provide access to upcoming, current, and past weeks.

## Capabilities and Constraints

- Recipes include meal types, ingredients, quantities, and preferred weekdays.
  Weekly generation uses the recipe library and honors scheduling preferences,
  reporting exceptions when necessary.
- Ingredients form a shared catalog. Shopping setup can record how an ingredient
  is purchased and the measurements needed to calculate buying quantities.
- Weekly shopping lists group ingredients by category and scale quantities by
  the menu's people count. Missing recipes or conversions must remain visible;
  purchase measurements must not be invented.
- Shopping checklist marks are temporary and are not persisted across leaving
  the screen or reloading.
- The current prototype has no authentication; data is shared locally.
  Authentication is planned. Future account roles, ownership rules, and
  authorization behavior remain undecided and must not be assumed.
- PWA installation and offline behavior require separate verification; do not
  infer complete offline support from the presence of a service worker.

## Brand Commitments

- The user-facing product name is Comal; the repository is named Meal Planner.
- Greda is the design system. Use its existing Comal theme and semantic tokens,
  preserving the established mobile-first behavior and visual language during
  refinements. Additional UI colors require discussion with the user.
- Existing identity assets include the flower mark and Comal app icons.
- The Comal theme references Mexican cazuelas de barro through color and
  typography, with a handmade character and no decorative textures. The confirmed
  theme direction and light/dark distinctions are recorded in `DESIGN.md`.
- No additional positioning claim or voice guidelines have been confirmed.

## Evidence on Hand

- `docs/client.md` documents the current user workflows and their limitations.
- `README.md` records the existing Rails API and React/TypeScript/Vite PWA setup.
- `client/src/i18n/en.ts` and `client/src/i18n/es.ts` contain interface copy.
- `client/public/comal-icon.svg` is the app icon source; locale manifests and
  raster app icons are in `client/public/`.
- `client/tests/` contains browser behavior coverage using mocked API responses;
  this does not establish Rails integration or PWA installation/offline behavior.

## Product Principles

1. Reduce the number of decisions required to get a usable weekly meal plan.
2. Keep recipes, scheduled meals, and shopping needs connected.
3. Make the core workflow practical on a phone, including at the supermarket.
4. Support English and Spanish without rewriting the user's recipe content.
5. Show missing information and planning exceptions honestly rather than inventing
   quantities or presenting an incomplete plan as complete.
