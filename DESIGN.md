---
name: Comal
description: Mexican cazuelas de barro expressed through clay colors, clear typography, and generous corners.
colors:
  terracotta: "hsl(18 68% 31%)"
  terracotta-hover: "hsl(18 68% 28%)"
  warm-cream: "hsl(32 32% 94%)"
  raised-cream: "hsl(32 38% 97%)"
  warm-tan: "hsl(32 26% 88%)"
  secondary-control: "hsl(32 22% 86%)"
  garden-sage: "hsl(90 20.40816% 80.78431%)"
  clay-interaction: "hsl(18 44% 84%)"
  dark-brown: "hsl(26 20% 16%)"
  secondary-text: "hsl(28 13% 27%)"
  muted-text: "hsl(28 12% 31%)"
  field-border: "hsl(30 14% 39%)"
  destructive: "hsl(6.512 57.848% 35%)"
typography:
  display:
    fontFamily: "Fraunces, serif"
    fontSize: "clamp(37px, 5vw, 62px)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Fraunces, serif"
    fontSize: "32px"
    fontWeight: 600
    letterSpacing: "-0.04em"
  day-title:
    fontFamily: "Fraunces, serif"
    fontSize: "23px"
    fontWeight: 600
  body:
    fontFamily: '"DM Sans", sans-serif'
    fontSize: "1rem"
    fontWeight: 400
  label:
    fontFamily: '"DM Sans", sans-serif'
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
  caption:
    fontFamily: '"DM Sans", sans-serif'
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
  eyebrow:
    fontFamily: '"DM Sans", sans-serif'
    fontSize: "10px"
    fontWeight: 700
    letterSpacing: "0.13em"
  receipt:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace"
    fontSize: "0.75rem"
    lineHeight: 1.625
rounded:
  sm: "0.375rem"
  md: "0.75rem"
  lg: "0.75rem"
  meal-card: "17px"
  day-card: "20px"
  dialog: "24px"
  hero: "30px"
  full: "9999px"
spacing:
  unit: "0.25rem"
  gap-2: "0.5rem"
  gap-3: "0.75rem"
  gap-4: "1rem"
  gap-6: "1.5rem"
  gap-8: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.terracotta}"
    textColor: "{colors.warm-cream}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "8px 16px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.terracotta-hover}"
  button-secondary:
    backgroundColor: "{colors.secondary-control}"
    textColor: "{colors.dark-brown}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "8px 16px"
  button-outline:
    backgroundColor: "{colors.warm-cream}"
    textColor: "{colors.dark-brown}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "8px 16px"
  button-ghost:
    backgroundColor: "transparent"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "8px 16px"
  button-link:
    textColor: "{colors.terracotta}"
    backgroundColor: "transparent"
  input-search:
    backgroundColor: "{colors.raised-cream}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "4px 12px"
  meal-type-breakfast:
    backgroundColor: "{colors.garden-sage}"
    textColor: "{colors.secondary-text}"
    rounded: "5px"
    padding: "4px 6px"
  day-card:
    backgroundColor: "{colors.raised-cream}"
    textColor: "{colors.dark-brown}"
    rounded: "{rounded.day-card}"
    padding: "19px"
  navigation:
    rounded: "19px"
    padding: "7px"
  meal-row:
    backgroundColor: "{colors.raised-cream}"
    rounded: "{rounded.lg}"
    padding: "6px 12px"
---

# Design System: Comal

<!-- impeccable:design-map -->

Name: Comal
Colors: primary: terracotta hsl(18 68% 31%); secondary: warm-tan hsl(32 26% 88%); tertiary: garden-sage hsl(90 20.40816% 80.78431%); neutral: warm-cream hsl(32 32% 94%) (+9 more in the sidecar)
Fonts: Fraunces (display, headline, day-title); DM Sans (body, label, caption, eyebrow); ui-monospace (receipt)
Spacing: unit 0.25rem, gap-2 0.5rem, gap-3 0.75rem, gap-4 1rem, gap-6 1.5rem, gap-8 2rem
Radius: sm 0.375rem, md 0.75rem, lg 0.75rem, meal-card 17px, day-card 20px, dialog 24px, hero 30px, full 9999px
North Star: "The Everyday Kitchen"
Rules:

- The Semantic Role Rule. Background, text, and border roles are independent:
- The Labeled Category Rule. Breakfast uses sage, lunch uses tan, and dinner
- The Today Border Rule. Today's day card uses the action-colored border while
  Elevation:
- Subtle: 0 1px 2px hsl(var(--base-black) / 0.08)
- Raised: 0 8px 24px hsl(var(--base-black) / 0.12)
- Dialog: 0 24px 70px hsl(var(--base-black) / 0.24)
  Don't:
- Don't copy this palette into a second application theme or add UI colors without discussion.
- Don't confuse neutral primary text/borders with action-colored emphasis.
- Don't change category badge fills on hover or rely on category color alone.
- Don't add decorative textures to convey the cazuela reference; use color and typography.
- Don't add a decorative illustration to the existing menu hero during refinement.
- Don't replace Greda behavior with consumer overrides before investigating the library.
  Do:
- Do import Greda primitives directly and use its Comal semantic roles. Apply
  Greda typography utilities directly to controls and text. Use `text-label`
  for field and group labels, `text-body` for field values, and `text-caption`
  for hints, optional markers, and validation messages. Keep field values at
  the body size across viewport widths.
- Do preserve the mobile-first layout and allow translated labels and names to wrap.
- Do retain labeled categories, visible keyboard focus, and explicit field errors.
- Do use Fraunces for headings and DM Sans for general text and controls.
- Do preserve readable supporting text and field boundaries in both color schemes.
- Do keep the receipt's monospace and torn-paper treatment within shopping lists.
  Map: client/src/styles.css
  Map: client/src/theme.css
  Full: .impeccable/design-full.md (read a section when you need its detail)

## Previews and editing

Quick ingredient usage and meal details share one preview: a bottom sheet on
mobile and a centered modal on desktop. Back retraces preview contents; Close
returns to the originating screen. Recipe and ingredient creation/editing use
dedicated pages, retaining the originating screen and returning to its preview
after recipe Save/Cancel or ingredient Done. Ingredient section saves stay on
the editor page and retain other drafts. Do not stack previews or put the main
editors in dialogs.
Editor back links, page headings, forms, and supporting messages use the shared
centered page container without an additional editor-specific width limit.

## Shopping receipt

Preserve one paper surface with monospace, dotted leaders, dashed category
separators, and a torn bottom edge. Use one column below 760px, two from 760px,
and three from 1100px; keep each category together. The compact header shows
the week and people count, with serving controls inside an Adjust disclosure.
Checked progress sticks below the header while scrolling. Grocery text is 14px,
checkbox labels provide a 44px-wide touch target, and checked rows stay in place.
Save checks per menu on the device, clearing checks for changed displayed
quantities or buying presentations. Each ingredient appears once. Packaged products
show only their name; weights, volumes, and pieces show a quantity when calculable.
Name-only entries are intentional, without conversion warnings or completeness
badges. Keep the receipt limited to product, optional amount, and checkbox; no
per-row calculation disclosures. Ingredient names still open recipe usage previews.
There is no additional shopping-adjustment step.

## Buying choices and recipe containers

Use Greda controls and Comal semantic tokens. Saved ingredient editors expose
only How I buy it below name/category, with piece, bulk, and package choices.
Present these as a native radio group with full-label touch targets: stacked on
phones, three columns from tablet. Bulk asks Weight or Volume rather than a
display-unit preference. Explain the actual receipt result in a quiet inset in
the form and alongside the saved summary. Summaries use a buying sentence plus
optional known contents or piece weight. Field errors sit beside their input;
invalid hidden contents expand. Keep Save/Cancel together and reset options in
a secondary disclosure with clear retained-data copy. Restore focus to the
section action after editing. Preserve Comal tokens, typography, and page width.
Package contents are optional supporting information behind a disclosure; known
contents remain editable. Do not ask users to document measurement references.
Piece and bulk choices include one optional weight field, normally grams per
piece. Existing multi-piece bases stay visible in its label without rounding the
stored ratio. No provenance fields or separate reference editor are exposed.
Buying saves retain the name draft; Done returns to the originating screen.

Recipe servings explain the entered quantities. Package contents are optional and
collapsed for new rows. Known snapshots remain visible, independently of buying
setup. An explicit action may copy known habitual contents. Changing ingredient
or unit clears the snapshot without requiring fresh entry. Preserve mobile-first
full-width fields and existing tablet columns.

The current behavior is documented in `docs/client.md`. The buying-section
refinement has been reviewed in source and diff, with browser regression coverage
updated. Before committing, `npm run build` and `npx tsc -p tsconfig.tests.json`
passed; the build reported a bundle-size warning. Tests were skipped at the
user's explicit request. Rendered browser review remains pending.
