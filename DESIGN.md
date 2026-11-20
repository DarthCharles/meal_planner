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

## Overview

**Creative North Star: "The Everyday Kitchen"**

Comal takes its warmth from Mexican cazuelas de barro: glazed clay cookware,
copper-brown surfaces, burnt-orange highlights, dark fired edges, and cream
painted details. Warm ivory backgrounds and near-white raised surfaces pair with
terracotta actions and sage tertiary panels. The full neutral palette runs from
pale tan stone supporting surfaces to warm charcoal text, with subdued borders
and secondary controls. A soft tan undertone keeps the foundation earthy while
lighter surfaces reduce the brown cast. Hover and focus backgrounds use a
warmer, more saturated clay tint.

DM Sans keeps body text clear, while Fraunces and generous corners give the
interface a handmade character. Dark mode uses warm charcoal surfaces, lighter
copper actions, and deep olive tertiary surfaces. Supporting text and field
boundaries remain readable on the supporting surfaces in both schemes. Badges
keep a stable background on hover because they represent noninteractive status;
buttons retain their hover feedback. Color and typography carry the reference
without decorative textures.

"The Everyday Kitchen" remains the guiding metaphor, with **tactile and
confident** components. Greda owns the Comal theme and semantic role assignments;
the app currently selects the light scheme. Frontmatter captures the installed
Greda 1.5.1 light tokens and app overrides as a source snapshot, not a second
theme to copy into application CSS. The description above is the confirmed theme
intent; its readability requirements have not been verified in this pass.

**Key Characteristics:**

- Mexican glazed clay cookware expressed through color and typography, without decorative textures.
- Terracotta actions, warm ivory foundations, near-white raised surfaces, and Garden Sage panels.
- Pale tan stone supporting surfaces, warm charcoal text, and subdued boundaries.
- Clear DM Sans body text, Fraunces headings, and generous handmade corners.
- Warm charcoal, lighter copper, and deep olive in Greda's dark scheme.
- Stable noninteractive badges and visible button hover feedback.
- A supermarket receipt pattern reserved for the shopping list.

## Colors

Warm clay, cream, brown, and sage supply the existing palette. Frontmatter records
the resolved light-theme HSL values; use the semantic roles below in code.
The intended balance is a soft tan undertone with lighter foundations that reduce
the brown cast. Terracotta / Warm Cream / Garden Sage remain the descriptive
palette names; their values come from Greda rather than the metaphor.

### Primary

- **Terracotta**: primary actions, action links, keyboard focus, the logo tile,
  and today's card border. Its darker hover value belongs to primary controls.
- **Clay Interaction**: hover and focus backgrounds on supporting controls.

### Secondary

- **Warm Tan**: secondary surfaces, including lunch badges and neutral notices.
- **Secondary Control**: secondary buttons; distinct from the secondary surface.

### Tertiary

- **Garden Sage**: menu hero surfaces and breakfast badges.

### Neutral

- **Warm Cream**: page background, dinner badges, and inverse text on actions.
- **Raised Cream**: cards, popovers, dialogs, search inputs, and receipt paper.
- **Dark Brown**: main text. Secondary and muted brown roles express hierarchy.
- **Field Border**: field outlines, card borders, and separators.
- **Destructive**: validation errors and destructive actions.

### Dark Scheme

Greda's dark Comal theme uses warm charcoal page and raised surfaces, lighter
copper actions, and deep olive tertiary surfaces. Supporting controls and
interaction fills remain warm and subdued. Primary hover becomes lighter copper
rather than the darker Terracotta used in light mode. Text and border roles
rebind with the scheme; keep supporting text and field boundaries readable on
supporting surfaces in both schemes.

Greda exposes this palette through `data-theme="comal"` together with
`data-color-scheme="dark"` on the same boundary. The application's current
document selects `light`; this theme documentation does not imply an implemented
dark-mode switch or verified dark-mode screens. Frontmatter component mappings
describe light mode; implementation must continue to use scheme-aware tokens.

**The Semantic Role Rule.** Background, text, and border roles are independent:
Greda's primary background is Terracotta, while primary text and borders are
neutral. Use action text/border roles for Terracotta emphasis.

**The Labeled Category Rule.** Breakfast uses sage, lunch uses tan, and dinner
uses cream; all retain visible labels and secondary brown text. Category fills
do not change on hover and do not substitute for selected-control styling.

## Typography

**Display Font:** Fraunces, with serif fallback.
**Body Font:** DM Sans, with sans-serif fallback.
**Label/Mono Font:** DM Sans for labels; the system monospace stack for receipts.

The serif supplies identity to meal names, dates, and headings. Sans-serif text
keeps instructions and controls direct. The app imports Fraunces weights 600/700
and DM Sans weights 400/500/600/700; do not assume every Greda typography preset
is used by the application.

### Hierarchy

- **Display:** the fluid, tightly tracked heading in the empty menu hero.
- **Headline:** section headings use the frontmatter headline role. Today's
  overview instead uses 26px on mobile and 36px from the tablet breakpoint.
- **Title:** day headings use the day-title role; meal-library and ingredient
  names use an 18px serif. Dialog headings use 27px, weight 600, and -0.04em tracking.
- **Body:** the base size is 16px; supporting descriptions commonly use 14px
  and metadata 12px. Body leading is normal by default, with explicit relaxed
  leading on supporting paragraphs.
- **Label:** medium-weight control text; small controls use 12px. Eyebrows use
  compact uppercase text and increased tracking. Meal-category badges use 9px
  uppercase bold text; these are observations, not a minimum-size recommendation.
- **Receipt:** monospace at 12px, increasing to 14px at tablet width. Amounts use
  tabular numerals. This exception belongs to shopping lists, not general forms.

## Layout

The shell has a maximum width of 1240px with 15px horizontal padding on mobile
and 24px from tablet width. Its minimum supported width is 320px. Reserve bottom
space for floating navigation: 105px on mobile, 110px on tablet, and 50px on desktop.
The header is 70px high on mobile and 86px from tablet width. Non-index pages
share a 12px top inset.

App breakpoints are tablet (641px), desktop (760px), and wide (901px). Collections
start in one column, become two at tablet, and three at wide. Weekly cards have
16px gaps, meal-library cards 14px, and ingredient cards 12px. Search and Add
remain in a single row, with the search input taking the available width.

The receipt uses CSS Columns: one below desktop, two from desktop, and three
from 1100px. Complete categories stay together and flow down, then across.
Greda's precompiled primitives may retain their own 768px typography breakpoint;
do not silently equate that with the app's desktop breakpoint.

## Elevation & Depth

The implementation combines tonal grouping with shadows. The sage hero groups
content without a shadow; day cards have subtle elevation, meal-library cards
explicitly remove shadows, and ingredients use bordered surfaces. Primary
buttons, floating navigation, popovers, and the receipt use stronger elevation.
Dialogs sit above a brown overlay at 40% opacity. This describes the code rather
than a separately confirmed elevation philosophy.

### Shadow Vocabulary

- **Subtle:** `0 1px 2px hsl(var(--base-black) / 0.08)` for day cards and supporting controls.
- **Raised:** `0 8px 24px hsl(var(--base-black) / 0.12)` for primary buttons,
  floating navigation, and receipt paper.
- **Dialog:** `0 24px 70px hsl(var(--base-black) / 0.24)` for modal panels.

**The Today Border Rule.** Today's day card uses the action-colored border while
retaining the same raised cream fill and subtle shadow as other day cards.

## Shapes

Greda provides rounded controls and fields. The app's large-radius override is
12px, matching its medium radius; do not substitute the theme's unmodified 24px
large-radius value. The frontmatter records both aliases deliberately.

Meal-library cards use 17px corners, day cards 20px, heroes 30px, and floating
navigation 19px. Filter buttons are pill forms; the Menu control uses the standard
rounded outline button.
Category badges use compact 5px corners. Mobile dialogs use asymmetric
24px upper and 15px lower corners; desktop dialogs use uniform 24px corners.

The flower sits on a 44px Terracotta tile rotated -6 degrees, with
12px/12px/12px/4px corners; the flower counter-rotates to remain upright.
Receipt paper is square with a decorative torn lower edge.

## Components

### Buttons

Tactile and confident, using Greda directly. Default controls have the shape and
dimensions in frontmatter; small controls are 32px high with 12px horizontal
padding, icon controls are 36px square, and large controls are 40px high.

Primary buttons darken on hover in light mode and lighten to copper in Greda's
dark scheme. Secondary buttons use the secondary-control
fill; outline and ghost variants use the clay interaction fill on hover. Link
buttons use action text and underline on hover. Focus retains Greda's ring;
invalid and destructive states use the destructive role. Disabled controls
retain the library's disabled behavior; app-wide button styling adds 65% opacity
and a waiting cursor.

Header navigation, language choices, recipe entry, and retry controls use a
minimum 44px height for touch.

Greda transitions normally use 150ms with cubic-bezier(0.4, 0, 0.2, 1).
Eligible action buttons move down 1px when pressed; pressed-state toggles and
popup triggers are excluded, and reduced-motion preferences suppress this move.

### Chips

Meal categories are noninteractive, labeled badges with the category mapping
above. Meal filters are separate pill buttons: primary when selected, outline
otherwise, with an accessible pressed state. Do not turn category badges into
selection controls by color alone.

### Cards / Containers

Day cards use the frontmatter shape and mobile padding, increasing padding to
22px at tablet width. Meal-library cards use an asymmetric 23px left inset and
18px right inset, with no shadow. Ingredient cards use 16px padding and 12px
corners. Preserve headings and explicit actions within each card.

### Inputs / Fields

Fields use Greda's border and focus styles. Search fields have a raised cream
fill; other inputs may be transparent on their containing surface. Native input
height is 36px. Textareas start at 60px high. Invalid fields gain a destructive
border; labels and validation text remain explicit. Combobox/select popovers
inside a native dialog must portal into that dialog's top layer.

### Navigation

The floating bottom navigation uses a 95%-opaque raised cream surface, a border,
15px backdrop blur, and raised shadow. It sits 18px above the bottom edge and
is hidden from desktop width. Active links use secondary buttons; other links
use ghost buttons, with visible 12px labels beneath 16px icons and a minimum 44px target height.

The Menu / Menú popover remains available at every width. Its active destination and
selected language use primary buttons; other choices use ghost buttons.
The Comal wordmark and flower link home. Keep navigation as links with active-page
semantics and action controls as buttons.

### Meal Rows and Menu Hero

Meal rows are full-width ghost buttons with a raised cream resting surface,
clay interaction hover, a meal-time label, a wrapping meal name, and a 16px
chevron. Minimum height is 44px; weekly rows use 57px on mobile and 67px at
tablet width. Hero rows use quieter labels and medium-weight secondary text,
with 11px category labels and a 68px minimum height on tablet. The sage hero shows these rows in one
column on mobile and three on tablet. It has no decorative illustration. The empty home hero provides a direct recipe
creation action, with first-recipe wording only after confirming an empty library.

### Dialogs

Native dialogs align near the bottom on mobile and center on desktop. Panels
have a 520px maximum width, 25px padding, and a viewport-aware scrolling area.
Keep title focus, focus restoration, Escape/backdrop dismissal, and page scroll
locking in the shared host. Stacked recipe details preserve the parent workflow.

### Shopping Receipt

Use one continuous raised cream paper surface with one header, footer, shadow,
and torn edge. Monospace type, dashed separators, dotted-style leaders, category
headings, and right-aligned quantities evoke a supermarket receipt. Checkbox
controls remain separate from ingredient links. Checked names and quantities
are struck through; quantities stay visible. Do not split categories into cards.

### Loading and Feedback

Skeletons use the existing muted/background gradient with a 1.4s shimmer;
preserve reduced-motion handling where implemented. Decorative placeholders
are hidden from assistive technology and loading is announced once. Neutral
notices use muted surfaces; form errors use destructive text. Keep explicit
retry actions and preserve available content on refresh errors.

## Do's and Don'ts

### Do:

- **Do** import Greda primitives directly and use its Comal semantic roles.
- **Do** preserve the mobile-first layout and allow translated labels and names to wrap.
- **Do** retain labeled categories, visible keyboard focus, and explicit field errors.
- **Do** use Fraunces for headings and DM Sans for general text and controls.
- **Do** preserve readable supporting text and field boundaries in both color schemes.
- **Do** keep the receipt's monospace and torn-paper treatment within shopping lists.

### Don't:

- **Don't** copy this palette into a second application theme or add UI colors without discussion.
- **Don't** confuse neutral primary text/borders with action-colored emphasis.
- **Don't** change category badge fills on hover or rely on category color alone.
- **Don't** add decorative textures to convey the cazuela reference; use color and typography.
- **Don't** add a decorative illustration to the existing menu hero during refinement.
- **Don't** replace Greda behavior with consumer overrides before investigating the library.

Source record: `client/src/styles.css`, `client/src/theme.css`, the installed
Greda 1.5.1 theme/tokens/components, and the client components described above.
This extraction was reviewed against source only; rendered appearance, contrast,
responsive behavior, and accessibility were not verified in this pass.
