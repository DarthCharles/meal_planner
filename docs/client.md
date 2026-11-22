# Consumer client

The consumer client is a mobile-first responsive PWA built with React, TypeScript, and Vite.

## Local setup

```bash
cd client
npm install
npm run dev
```

Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/).

The client uses `VITE_API_URL` for the API base URL. The default is `http://127.0.0.1:3000`.

## Linting and formatting

The tracked pre-commit hook applies ESLint fixes to staged client JavaScript and
TypeScript files, then formats staged client files with Prettier. Enable it once per clone with
`git config --local core.hooksPath .githooks` from the repository root.
Stage or stash unstaged changes in those files first. If either tool applies fixes, review
and stage them before retrying the commit; errors or ESLint warnings block
the commit. See [Git hooks](development.md#git-hooks) for details.

Run these commands from `client/` when verification is requested:

```bash
npm run lint          # Check JavaScript, TypeScript, React source, and browser tests
npm run lint:fix      # Apply available ESLint fixes
npm run format:check  # Check formatting without changing files
npm run format       # Format supported client files in place
```

`eslint.config.js` uses the recommended JavaScript and TypeScript rules, with
React's rules of hooks and exhaustive dependency checks treated as errors.
Unused TypeScript variables, parameters, and caught errors may use an `_` prefix
when intentionally unused. Browser, Node, and service-worker globals are scoped
to their respective files. TypeScript compilation remains the type checker;
ESLint does not start a TypeScript project service.

Import ordering uses `eslint-plugin-simple-import-sort` with `react` imports
first (including type-only imports), followed by side-effect imports,
`node:` built-ins, external packages, absolute/internal
imports, then relative imports. Separate groups with a blank line. Within each
group, imports and named specifiers are sorted alphabetically; side-effect
imports retain their relative order. Type-only imports stay in the same group
and precede value imports from the same module. `npm run lint:fix` applies this
ordering automatically. Avoid adding competing import-sorting rules or a
Prettier import-sorting plugin.

Prettier owns formatting: two spaces, double quotes, semicolons, trailing commas,
LF line endings, and a preferred line width of 100. `eslint-config-prettier`
disables conflicting lint rules. Both tools exclude generated build and
Playwright artifacts; Prettier also excludes the dependency lockfile and local
environment files. Editors can use the committed configurations with their
ESLint and Prettier integrations.

Use `npm run format` to apply formatting and `npm run format:check` to verify it.
These commands apply to the client; Rails retains its existing Ruby tooling.
Follow the opt-in verification policy in `AGENTS.md`; adding these commands does
not authorize running them during active editing.

## Languages and translation keys

Comal supports English and Spanish. Choose **English** or **Español** in the
header's Menu navigation popover. The choice is stored locally as `comal.locale` and
synchronized across tabs. Incoming storage events apply the latest stored choice
without writing it back, so queued events cannot replay old preferences between
tabs. Without a saved choice, the first supported browser
language is selected (including regional tags); English is the fallback.
Switching language preserves the current route, library filters, and saved-week
selection. The interface, accessibility labels, form validation, unit labels,
page title/description, document language, and selected PWA manifest follow the
choice. Date and number formatting uses `en-US` or `es-MX`.

Client copy lives in **one TypeScript catalog per language**:
`src/i18n/en.ts` and `src/i18n/es.ts`. Both use nested objects grouped by screen
or component, following the structure of Rails locale YAML. Shared labels live
under `common`, and stable domain labels under `reference`. For example:

```ts
export const en = {
  menu: {
    hero: { today: "Today’s menu" },
  },
  meals: {
    form: { name: "Meal name" },
  },
};
```

Read copy with `const { t } = useI18n()` and `t("menu.hero.today")`. Interpolation
uses Rails-style `%{name}` placeholders, for example
`t("common.edit_name", { name: meal.name })`. Plural entries use nested `one`
and `other` keys; `t("ingredients.usage", { count: 2 })` selects the appropriate
form with `Intl.PluralRules` and formats numeric values for the selected locale.
Plural categories absent from a catalog fall back to its `other` entry.
The English catalog defines the valid key paths; the Spanish catalog must match
its structure through TypeScript. Add entries to both files when changing copy.
No translation loader or extra dependency is needed.

Weekday matching and scheduling use stable English identifiers rather than
translated date labels. Calendar dates still preserve the API's UTC boundaries;
"today" uses the browser's local timezone. Meal and ingredient names,
descriptions, recipe notes, URLs, and submitted unit codes remain user content
or stable identifiers. Unknown meal types and units retain their original value.

API calls send `Accept-Language: en` or `es`. Menu query keys include the locale
because their persisted notices are rendered by Rails. Meal and ingredient saves
synchronize embedded meals across both cached menu languages. Regenerating a week
invalidates the other language's menu cache. Existing server errors reflect the
language requested when the error occurred; retrying uses the current language.
The browser suite uses mocks; Rails localization and stored notice rendering
have separate integration/service coverage. PWA installation and offline
language behavior still need separate verification.

## Current flows

- Open today's recipes and the current week's shopping list from Home.
- Browse the full current week directly from Home using the existing day cards.
- View, generate, or replace the next weekly menu from Home.
- Browse upcoming, current, and past weeks through Saved Menus and open their meals.
- Browse and filter meals.
- Browse, search, create, and rename shared ingredients through My Ingredients.
- Add a meal to the library.
- Install the app as a PWA.

The header's Comal logo and name link back to the index (the menu screen).

React Router's data router provides `/`, `/meals`, `/ingredients`,
`/saved-menus`, and `/menus/:menuId/shopping-list`. Creation and editing have
standalone routes: `/meals/new`, `/meals/:id/edit`, `/ingredients/new`, and
`/ingredients/:id/edit`. The header Menu uses real links with an
active-page indication. Unknown paths show a page-not-found screen.

Quick previews use the originating page's search parameters (`ingredient`,
`ingredientName`, `meal`, and `previewName`). Browser Back/Forward retraces the
preview steps; Close dismisses the entire preview. Direct preview links and
editor URLs also work. Search/filter inputs and the selected saved week remain
local UI state.

An editor opened inside the app retains its originating location in router state.
`App.tsx` keeps that screen mounted but hidden, so library filters, saved-week
selection, checklist progress, and an unfinished people-count input survive the
editor visit. Recipe Save/Cancel and ingredient Back return to the origin, reopening its preview when
applicable. Scroll position and connected trigger focus are restored. Direct
editor visits return to the corresponding library. Reloading does not preserve
unsaved inputs or checklist marks. Editors load the existing API resources and
reference data before initializing their form. Meal creation keeps Cancel available
while its reference options load; failures offer retry instead of
creating an empty edit draft. Unsaved drafts prompt before navigation or browser
Back and register a before-unload warning. Successful saves bypass that prompt.

`App.tsx` supplies the shared header, content area, and navigation. Non-index
routes use a nested `PageLayout` with a consistent 12px top inset; My Meals,
Saved Menus, My Ingredients, and the not-found screen do not add their own top spacing.
The index lays out the today, current-week, and next-week sections.

Production hosting must serve `client/dist/index.html` for client navigation
paths (including unknown page paths), while serving static assets normally.
Vite's development and preview servers already provide this SPA fallback.
Keep Rails API traffic on its configured API origin; do not rewrite API requests
to the client entry point. The service worker caches the app shell and both language manifests; offline deep
links and PWA installation require separate verification.

Saved Menus is available in the header Menu popover. It uses the shared
`GET /menus` query and lists all saved weeks newest first,
with Upcoming, Current, and Past labels based on calendar dates in the browser's
timezone. Date labels preserve the API calendar dates and include the year.
Selecting a week displays its meals Monday–Sunday and any generation notices;
meal rows open the existing meal details dialog. Loading, empty, and API error
states are explicit, with retry on error and no demo fallback.
Saved Menus contains saved weekly assignments, not previous regenerations of the
same week. Meals still reference the live library, so later recipe edits also
appear in old menus.

The header's translated Menu / Menú button opens a Greda popover on all screen
sizes, ordered as
“My Menu”, “My Meals”, “My Ingredients”, a separator, “Saved Menus”, a separator, and “Add a meal”.
Choosing a destination closes the popover before navigating, so its exiting
keyboard layer cannot intercept Escape in a dialog on the destination screen. “Add a meal” opens the meal form;
closing the form returns focus to Menu. The popover is named Navigation menu /
Menú de navegación. Its trigger uses
Greda's standard rounded outline button, with a compact label and wordmark on
narrow screens.
The Menu popover uses Greda's primary (`default`) button variant for the current
destination and selected language, with `ghost` for the other choices.
All choices use `primary-hover` backgrounds and `primary-foreground` text on
hover and visible keyboard focus.
The library keeps its own add action.

My Ingredients is available in the header Menu.
It displays the shared catalog alphabetically, with case-insensitive local name
search and a visible result count. My Meals and My Ingredients share a collection
header with a 32px title and an Add action: stacked below the title on mobile,
alongside it from tablet width. The ingredient introduction stays below its title.
The Collection eyebrow is omitted on both pages. Search occupies its own full-width
row below the header, followed by the ingredient count or meal-type filters.
Search is disabled until catalog
data is available. Ingredient names wrap on narrow screens.
My Meals uses the same search field styling and header spacing.
The page fetches `GET /ingredients` only when opened and reuses the same React
Query cache as the meal form. Initial loading uses a shimmer skeleton for the
result count and six ingredient cards
in the catalog's responsive grid. The header and search stay visible during loading.
The skeleton announces loading once, hides decorative placeholders from
assistive technology, and disables animation for reduced-motion preferences.
It also shows empty catalog, no search results, and request errors with retry;
cached ingredients remain visible if a refresh
fails. It does not use demo data. Each ingredient card shows its meal usage
count from the backend catalog response, or an unused message. Cards use larger
serif ingredient names and link-style (`link`) usage buttons that open a quick
preview, including for unused ingredients. The preview lists meals using the
ingredient without fetching `/meals`. Selecting a meal shows its details in the
same dialog, fetching only `GET /meals/:id`; Back returns to usage. Edit ingredient
opens the dedicated ingredient editor directly. Closing returns focus to the
original usage button when it remains mounted.

“Add ingredient” and each row's “Edit” action open dedicated pages with a
React Hook Form name field. Blank names are blocked locally; duplicate names
and other API errors keep the form open with the draft intact. Saving uses
`POST /ingredients` or `PUT /ingredients/:id`; cancel creates no changes.
Renaming preserves ingredient identity and updates names in cached meals and
menus. Ingredient saves refresh the catalog. Meal saves also synchronize usage
references in the catalog cache, including removed ingredients and renamed meals.
The meal form still supports creating ingredients when saving a meal.

Saved ingredient editors show **How do you buy this ingredient?** as a full-width
section of the ingredient form. The saved preference is already selected and edits
happen in place. **Save buying preference** stays visible and is enabled when the
active choice has changes. It saves independently from name and category. Catalog
browsing and new unsaved ingredients do not fetch shopping profiles. The client
does not call the separate measurement-reference endpoints.

- **Use recipe measurements** needs no inputs and is the default without a
  profile. Saving it over a custom preference deletes the profile and preserves
  saved piece weights and recipe measurements.
- **By the piece**, **By weight**, and **By volume** show an optional piece weight.
  Existing ratios keep their exact measured basis. A blank new weight is omitted,
  while clearing a saved weight sends null. Weight and volume use the existing
  bulk profile and retain the original stored unit when its dimension matches.
- **In a package** shows the type, optional contents amount, and label unit
  together. The type defaults to a generic package. Reference units load when
  this choice is selected, with loading and retry scoped to its fields. Blank
  contents save both fields as null. Switching choices retains entered values
  in the draft. Saving a different choice over a custom package clears its
  package details.

A successful save updates the section in place and preserves unsaved name and
category edits. An error keeps the buying draft. **Back** returns to the origin
and prompts before discarding either draft. Standalone ingredient creation
continues on the persisted edit URL after saving.

React Query saves profiles with `PUT /ingredients/:id/shopping_profile` and
restores recipe measurements with `DELETE`. It synchronizes profile caches and
invalidates shopping lists after success. A failed recalculation does not turn
a successful preference save into a failed save. Buying preferences do not
rewrite recipe container snapshots.

The ingredient editor shows a Delete ingredient action only for unused ingredients.
It calls `DELETE /ingredients/:id`
and removes the ingredient from the shared catalog cache after success. While
deletion is pending, saving and repeated deletion are disabled. Success returns to the origin; failures keep the editor open with the draft and API error. Used ingredients
and the creation page have no Delete button;
the backend also rejects deletion if an ingredient becomes used after loading.

Home opens with today’s meals and a Shopping list link labeled with the current
menu’s date range. The link sits below the meals on mobile and beside the heading
on tablet and desktop. The menu’s calendar dates are compared with the browser’s
local date. If today has no meals, Home shows the next scheduled date when one
exists.

“This week” shows the full current week in Monday–Sunday order. It reuses the
existing `DayCard` component and meal previews. Today has an accent border.
The Saved Menus link selects the current week in the archive. Both views show
generation notices and derive card dates from the menu range.

“Next week” shows the Monday–Sunday range targeted by the generation API, which
starts on the next strictly following Monday in UTC. A saved plan has a link
that selects that week in Saved Menus. Regenerating requires confirmation with
the affected dates. If the UTC target week changes during confirmation, Home
refreshes the range and asks for a new planning action. While generation is
pending, the action stays disabled even
after leaving and returning to Home. A failure appears in the planning section and
leaves saved menus available.

The meal library has no hero, keeping its heading, search, filters, and add action
at the top of the screen. Its Add action remains available during initial loading;
skeletons represent the full-width search field, filters, and six meal cards using
the same responsive grid. The skeleton
announces loading once, hides decorative placeholders from assistive technology,
and disables shimmer for reduced-motion preferences. Cached meals remain visible
during background refreshes.

Today’s meals and weekly day cards reuse `MealRow`. Today’s meals have labeled
category badges and horizontal separators, with three equal columns and vertical
separators from 901px. The meal
name sits beside its badge on mobile and below the badge at larger widths.
Buttons have at least 44px touch targets and long names wrap. Weekly day cards
use their existing compact rows, with the meal type above each name and a
trailing chevron. Both button variants use the existing accent interaction fill.
Clicking a row or activating it with Enter or
Space opens the meal card through `useMealDialog` and the shared dialog host.
The card shows meal types, description, ingredient quantities and preparation
notes, and an optional recipe link. Missing ingredients have an explicit empty
message. Details use the meal already embedded in the menu and make no additional
API requests while their cache is fresh. An “Edit meal” action opens the dedicated
editor, prefilled with that meal. Saving or cancelling returns to the preview;
closing the preview restores focus to the original row.
Meal previews lead with their title, without an eyebrow. The editor shows
“Edit meal” as its heading and accessible region name. Details group meal
types, description, and preferred days together, followed by ingredients and a
separate wrapping footer for the recipe link and Edit meal action.

Home distinguishes missing plans from load failures. Initial failures show
a recovery message and Try again. Failed refreshes retain the last loaded plan.
With neither a current menu nor a saved plan for the generation week, Home checks
the recipe library. A confirmed empty library makes recipe creation the primary
action. With recipes available, planning is the primary action and recipe creation
is secondary. If next week is already saved, Home offers a link to that plan.
The recipe library and recipe-option forms still label fallback examples explicitly;
the library also provides Try again. Header and meal-row labels are larger on phones, and header
Menu controls have a minimum 44px touch height.

## Structure

```text
client/
  src/
    main.tsx      # React entry point, router/query/dialog providers, and service worker registration
    App.tsx       # shared shell and screen routes
    queryClient.ts # shared server-state cache and request defaults
    queryKeys.ts  # cache key prefixes (menu queries also include locale)
    i18n/         # nested English/Spanish catalogs and locale/formatting helpers
    components/   # header, navigation, illustrations, and generic dialog host
    features/
      ingredients/ # shared catalog, ingredient form, and mutation hooks
      menu/       # weekly menu screen, day cards, and query/mutation hooks
      meals/      # library, form, ingredients, query/mutation hooks, and meal type styles
    demoData.ts   # fallback meals and menu for offline development
    api.ts        # Rails API requests
    types.ts      # API-facing TypeScript types
    styles.css    # Tailwind/Greda imports, app utilities, and global defaults
    theme.css     # typography/shape overrides and a gradient using Greda colors
  public/
    manifest.webmanifest
    sw.js
```

The UI uses Greda's Storybook Comal palette: warm cream surfaces, terracotta
actions, and sage accents, with Comal typography and a bowl-based mark. SVG
artwork keeps its own brand colors.

## Server state and hooks

TanStack React Query manages server data. `main.tsx` supplies the shared
`QueryClientProvider`; `queryClient.ts` configures a 30-second stale time and
disables automatic retries for reads and writes. Stale queries can refetch on
window focus or reconnection. Meal types and units remain fresh for five minutes.
The cache lives in memory and is not persisted for offline use.

Feature hooks in `features/menu/queries.ts` and `features/meals/queries.ts` expose
`useMenus`, `useMeals`, `useMeal`, `useMealTypes`, `useUnits`, `useGenerateMenu`,
`useCreateMeal`, and `useUpdateMeal`. Query/mutation status supplies loading,
saving, and API errors; HTTP calls remain in `api.ts`, using `fetch` with the
query's abort signal for cancellable reads.

Query ownership follows the feature that consumes the data:

- `MenuScreen` and `SavedMenusScreen` share `useMenus`. Home checks `useMeals`
  when it needs to distinguish an empty library from a missing plan.
- `NextWeekPlan` mounts `useGenerateMenu` for Home’s planning action.
- `MealsScreen` mounts `useMeals` when the library is opened.
- `MealDialogContent` mounts `useMealTypes` and `useUnits` only while the editor is open.
  It waits for both queries before mounting `MealForm`, so an edit draft starts
  with the correct meal type IDs. `MealForm` owns create/update mutations and
  unsaved input state.

`App.tsx` owns the shell and route composition; it does not fetch data or pass
API collections through props. Display components such as `MenuView`, `DayCard`,
and `MealsView` receive data and callbacks through props. Nested ingredient
inputs access their form through React Hook Form context.
Adding an ingredient focuses the new row's ingredient-name field.
Opening Home requests `/menus` first. It requests `/meals` if both planning periods
lack a menu, and the library requests `/meals` when opened directly. The header
handles navigation and language. Opening a form adds `/meal_types` and `/units`.
Fresh cached data is reused when revisiting a screen or reopening a form.

Successful mutations update the cache from the API response. Generating a menu
puts it first in the menu list. Saving a meal updates the library and replaces
that meal wherever it appears in cached menus. In-flight reads are cancelled
before applying those responses so older data cannot overwrite the update.
Individually fetched meal details also receive meal and ingredient-name updates.
If the meal list has never loaded, it is fetched on the next library visit rather
than being replaced with a partial list containing only the saved meal. Creating
a meal from the menu does not trigger an unused library request.

React Router derives the current screen from the URL. The dialog provider owns the
active dialog. Unsaved form inputs, validation errors, search, and filters stay
local to their components.

Initial menu failures show a recovery message and Try again without example data.
Initial meal, type, and unit query failures use demo data only for the failed
resource and label the examples in the screen or modal that owns the query.
Successful resources stay intact. Demo values are presentation
fallbacks and are never stored as successful query results. A failed background
refresh retains cached data and displays the error; failed mutations retain the
existing data and leave the form open for correction or retry.

## Forms

`MealForm` uses React Hook Form's `useForm` with typed default values for create
and edit. Native meal name, description, URL, quantity, and note fields use
`register`; the meal-time toggle buttons use `Controller` to preserve numeric
meal type IDs. React Query continues to own save requests, pending state, API
errors, and cache updates.

The meal editor shows the name and servings first, followed by the ingredient
list, description, recipe link, and planning preferences. The save action sticks
to the bottom edge of the viewport at every width and returns to the page flow
at viewport heights of 420px or less. Back exits the editor and protects any
unsaved draft. Meal and ingredient controls use Greda’s `surface-raised` fill.
Fields and group labels use Greda’s label typography, with an 8px gap above
field controls. Hints, optional markers, and validation messages use caption
typography. Input values and select triggers use the body size at every width.

Ingredient units use Greda's `Select` through RHF `Controller`, with codes from
`GET /units`. The trigger shows the saved unit when editing, supports keyboard
selection, and exposes validation errors. Its popup renders inside the field
container; Escape dismisses the unit list and restores focus to the trigger.

Ingredient names use Greda's `Combobox` through RHF `Controller`. Opening the
form fetches and caches `GET /ingredients`; filtering happens locally. Users
select an existing ingredient or explicitly choose **Add “…” as a new ingredient**.
Created options remain drafts until the meal saves, so cancelling does not
create catalog entries. Existing options submit `ingredient_id`; new options
submit `name`. Edit defaults preserve the saved ingredient identity. Successful
saves merge returned ingredients into the catalog cache, making newly created
ingredients available in the next form without an extra fetch. Catalog loading
and errors stay inside the form; a failed catalog request has a retry action.

Typing alone does not commit a selection. The form blocks saving until the user
selects or creates an option, including when replacing a previously selected
ingredient. The combobox popup portals inside its ingredient field container. Arrow keys and
Enter select options without submitting the meal; Escape dismisses suggestions
without leaving the editor.

`FormProvider` shares the draft with `IngredientManager`, which uses
`useFieldArray` with generated row IDs. The editor starts with compact rows that
show the ingredient name, quantity, unit, and any preparation note or package
size. Selecting a row opens Name, Quantity, and Unit beneath its summary and
focuses Quantity. One row opens at a time. Ingredient details houses the note,
package size when applicable, and Remove. The chevron in the summary row closes
the editor and keeps draft changes. Undo restores the most recently removed
ingredient in its original position.

Add ingredient appears after the list and focuses ingredient search. Add another
checks the current row before opening the next one. On phones, Quantity and Unit
share a row beneath the ingredient name. At form widths of 40rem or more, the
three controls fit side by side. The inputs retain visible labels and 44px
targets. A single meal save sends the entire draft.

Validation requires a nonblank name and description, a positive whole serving
count, and at least one meal time. The servings number input starts blank for new
recipes and shows the saved count when editing. The count describes how many
people the entered ingredient quantities serve.
Named ingredient rows use a number input for positive decimal quantities such as
`0.5` and `1.5`, sending their input values as strings. The supported quantity range
is positive after six-place storage rounding through 1,000,000,000; Rails remains
the authoritative validator. Repeated ingredient selections have independent
quantities and notes; catalog usage updates deduplicate recipe IDs. Each row
needs a unit. Every added row needs a selected or newly created ingredient
before saving. Closing a blank row discards it. Invalid fields show their own errors and a
blocked save opens the first invalid ingredient after the required meal fields
are complete. Cancel protects unsaved changes, and failed saves preserve the
draft.

For package units, **Ingredient details** includes optional package size
fields and a prompt that names the container. Opening Details on a saved
ingredient with a package unit looks up its buying size. When available, **Use saved size** displays
the amount and copies it into the recipe on selection. Replacing an entered
size requires confirmation. Manual entry also works for a new ingredient.
Blank sizes are omitted, and entered sizes are saved with the recipe. Changing
the ingredient or package unit clears the old size and its validation errors.

## Day preferences

The meal form's **Preferred days** field uses React Hook Form through
`PreferredDaysField`. Individual weekday toggles support custom choices. A
“Clear all” action beside the label clears the selected days and uses the same
styling as “Add ingredient.” It is disabled when no days are selected.
Clearing all choices restores Any day (an empty array). Existing meals default to
Any day, and the edit form initializes from the saved preference. Meal details
show the saved days; saving also updates meals embedded in cached menus.

Generation honors preferences before optimizing variety, repeating suitable
meals across days if needed. Exceptions are used only when necessary to complete
a menu. The weekly view displays the menu's persisted `generation_notices`,
including after reloading. These notices describe generation-time preferences;
subsequent meal edits do not rewrite them.

Browser tests cover selecting all days, custom days, clearing preferences, submitted
payloads, nested menu details, and fallback messages on generation/reload in
desktop Chromium. Preference-toggle layout is also checked at mobile and tablet
widths. Rails tests verify the actual scheduling and API contract.

## Dialogs

`DialogProvider` in `components/dialog/` wraps the application beneath
`QueryClientProvider`. `useDialog` exposes stable `openDialog` and `closeDialog`
actions. The provider supports one active dialog with a required title, optional
eyebrow, and content render function. Title and eyebrow accept either a string or
a function returning a string. Use `title: () => t("meals.dialog.new_favorite")`
for translated labels so an open dialog updates its visible and accessible name
when another tab changes the language, without replacing the draft or focus.
The generic API also supports plain strings:

```tsx
const { openDialog } = useDialog();
openDialog({
  title: "Confirm action",
  content: ({ close }) => <button onClick={close}>Done</button>,
});
```

`DialogHost` owns the native `<dialog>` shell and opens it with `showModal()`.
Its shared header uses a 12px gap before content, centers the title beside the
44px Close target, and allows long titles to wrap without crowding the button.
It names the dialog using its title, focuses the title initially (including while
content loads), makes the background inert, and locks page scrolling while the
content panel can scroll. Escape, the close button, and a click that starts and
ends on the backdrop dismiss it. Closing restores the previous scroll settings
and focuses the original trigger if it still exists.

Every opening has a unique instance key, so replacing dialog content resets its
local form state. The `close` passed to content only closes that instance; use it
for save completion so older asynchronous work cannot close a newer dialog.
`closeDialog` explicitly closes whichever dialog is currently active. Replacement
keeps the original trigger as the focus restoration target.

`PreviewController` synchronizes the active URL preview with the shared host.
Only one preview is shown: usage and meal details replace each other, with an
explicit Back action. `onDismiss` synchronizes user dismissal with the URL;
programmatic replacement does not navigate. `returnFocus` preserves the original
trigger across an editor round trip. Editor pages never render inside the dialog.
Editor back links, headings, forms, and supporting messages use the shared
centered page container, matching the shopping and library pages without an
additional editor-specific width limit.

`features/meals/useMealDialog.tsx` retains its existing feature entry points but
now opens URL previews or editor routes through `useWorkspaceNavigation`.
`MealDialogContent` remains the reference-data/form loader on the editor page.
`EditorDraftContext` tracks dirty recipe, ingredient, and buying-presentation drafts;
the data router's blocker protects navigation. Form and mutation logic stays in
the feature components and query hooks. Navigating away does not cancel a pending
mutation's cache updates, and callbacks from an unmounted form cannot leave a
subsequently opened editor. `tests/dialog.spec.ts` covers preview focus, backdrop
dismissal, editor loading/cancellation, dirty Back navigation, pending saves, and
generic content replacement using the isolated `dialog-harness` fixture.

## Styling with Tailwind

Tailwind CSS v4 runs through `client/postcss.config.js` using the
[`@tailwindcss/postcss` integration](https://tailwindcss.com/docs/installation/using-postcss).
Use Node.js 22.12 or newer (Node 24 recommended) when installing dependencies and building the client.
The existing `npm run dev` and `npm run build` commands compile Tailwind automatically.

Add complete utility class names directly to JSX, for example
`className="flex items-center gap-3"`. Tailwind scans `client/src/` for classes;
avoid constructing class names dynamically, such as `bg-${color}-500`.

The client pins `@darthcharles/greda` 1.6.0. Lucide icons and their types are
available through `@darthcharles/greda/icons` without a separate icon dependency.
TypeScript uses `Bundler` module resolution to honor package subpath exports,
including Greda's icons entry point, consistently with Vite.
Greda's `Collapsible` powers buying setup reset options, ingredient package
contents, recipe container contents, and the shopping receipt's Adjust controls.
Editable sections keep their fields mounted while collapsed so draft values and
validation remain available.
Planning uses `Plus` or `Ellipsis` while pending; meal rows use `ChevronRight`, close/remove
buttons use `X`, and notices use `Info`. Icons inherit the surrounding semantic
text color and are hidden from assistive technology; visible labels and existing
button accessible names identify each action. The custom flower SVG remains part
of the header's identity. The navigation
trigger uses a visible translated Menu / Menú label rather than profile initials.
`styles.css` imports Tailwind,
Greda's compiled styles in the `components` layer, its Tailwind 4 tokens, the
packaged `@darthcharles/greda/themes/comal.css` theme, then `theme.css`. Do not
also import Greda CSS in JavaScript. This layer order lets app utilities override
component styles.

`client/index.html` selects the official theme with `data-theme="comal"` and
`data-color-scheme="light"` on `<html>`, so dialogs inherit it too. The dialog
test fixture selects the same theme. Comal supplies the palette, font stacks,
and base radii; the app loads DM Sans and Fraunces through the existing font
import. Greda supplies Comal's lighter warm ivory and tan stone neutrals,
charcoal text, terracotta actions, pale sage tertiary surfaces, warm neutral
secondary controls, and clay interaction fills. The neutral palette has a softer
tan undertone and less of a brown cast in both color schemes. Noninteractive
badges retain their backgrounds on hover. Typography, shape, and semantic roles
remain the same. The optional La Viuda theme is not selected. No palette values
are copied into the app. Greda derives surface, text,
border, component color, and shadow tokens. `theme.css` only keeps app font
sizes/weight, the existing large radius, and a loading gradient using `muted`
and `background`. Action-colored text and borders use `text-action` and
`border-action`; `text-primary` and `border-primary` use neutral category roles.

Meal category badges share their fill and text mapping across the menu hero,
library, and meal details. Breakfast uses `surface-tertiary` (sage) and lunch
uses `surface-secondary` (tan), both with `text-secondary` text. Dinner uses
`bg-foreground` (dark brown) with `text-background` (cream) to distinguish it
clearly from lunch. These existing theme roles reverse in dark mode. Category
colors remain independent of control and interaction colors.
Menu heroes, including loading, empty, and no-current-week states, use Greda’s
raised cream `bg-card` surface. Category badges carry the sage accent instead
of the whole hero.
Unknown categories use cream (`surface-primary`) with `text-secondary` text.
Badges use `mealTypeColorClassName`; the fill and text mapping lives in
`features/meals/mealTypes.ts`. Badges use plain text labels without decorative
dots; the visible labels identify each category without relying on color.
Notices use neutral `muted` surfaces; errors in forms
use `destructive`. Today's card uses the raised `bg-card` surface with an
action-colored (`border-action`) border. Header controls and meal rows use
Greda's variant hover colors: ghost controls use the clay `accent` interaction
fill, while primary controls use `primary-hover`. Keyboard focus retains Greda's
focus ring. Reuse these existing roles before introducing a new
color, and discuss any needed palette
extension with the user first. SVG illustrations keep fill and stroke colors
inside their markup. Standalone PWA metadata and the public icon retain their
static brand colors because they load independently of application CSS.

The header uses `components/FlowerArt.tsx`, matching the favicon's cream flower
with a green center. The flower has no background of its own; the header's
terracotta (`bg-primary`) tile supplies the fill. The header preserves its
tilted tile with asymmetric corners and counter-rotates the flower to keep it
upright. The tile is 44px square with a 40px-wide flower mark.

Menu heroes use the raised cream surface with headings, supporting text, and meal rows.
Loading, loaded, and empty heroes have no decorative illustration or space
reserved for one. The navbar flower retains its fixed SVG colors, independently
of UI tokens.

The favicon and installed app icons use just the flower on a solid terracotta
background. `public/comal-icon.svg` is the source for the raster icons. Both locale
manifests declare 192px and 512px PNG icons with `any maskable` purposes; the flower
fits within the central maskable safe area. `index.html` separately declares the
180px `apple-touch-icon.png` for iOS. Raster sources are opaque square images;
the operating system supplies Home Screen corner masking. The service worker
precaches these assets under `comal-shell-v3`. Existing installed icons may need
the app to be removed and added again to display the updated artwork on iOS.

To regenerate the PNG assets after editing the flower SVG, export
`client/public/comal-icon.svg` at 180, 192, and 512 pixels square, saving as
`apple-touch-icon.png`, `comal-icon-192.png`, and `comal-icon-512.png` respectively
in `client/public/`. For example, with Inkscape installed on macOS, from the
repository root:

```bash
/Applications/Inkscape.app/Contents/MacOS/inkscape client/public/comal-icon.svg --export-type=png --export-width=180 --export-height=180 --export-filename=client/public/apple-touch-icon.png
```

Greda supplies `Input`, `Textarea`, `Card`, and `Badge`. Cards retain the article
role and existing headings. Inputs forward React Hook Form refs, native props,
and validation ARIA attributes. Import UI primitives directly from
`@darthcharles/greda`, using its variants and sizes rather than defining local
primitive wrappers. Buttons use Greda's `default`, `secondary`, and `ghost`
variants and default to `type="button"`; form save actions explicitly use
`type="submit"`. Navigation, filters, meal-time toggles, and ingredient actions
also render Greda buttons directly, with layout classes where needed.

The native dialog/provider remains in place for quick previews. Ingredient
comboboxes and unit selects remain inside their feature containers on editor
pages. Controls used in native dialogs must portal inside the modal top layer.

Components use Tailwind utilities directly in JSX for responsive layout and
app-specific states. Meal type order and labels live in
`features/meals/mealTypes.ts`.

`styles.css` contains the layered imports (including Preflight), breakpoints,
fonts, the loading shimmer animation, and global body/button defaults. Keep
component styling in JSX rather than adding component selectors or `@apply`
wrappers to this file.

The theme preserves the existing layout breakpoints: `tablet:` at 641px,
`desktop:` at 760px, and `wide:` at 901px. Layouts start with mobile utilities
and add these variants for larger screens.

## Shopping lists and categories

Current menus and the selected saved menu link to the dedicated
`/menus/:menuId/shopping-list` page. Its back action returns to the originating
current/saved menu and restores the selected saved week. The back link uses the
same left arrow and minimum touch height as the meal editor. The receipt occupies one
full-width paper surface with one header, footer, shadow, and decorative torn edge.
Inside it, CSS Columns packs complete categories into a masonry-style layout:
one column below 760px, two from 760px, three from 1100px. Categories flow top to
bottom and then across, retaining their API order. Each category stays together,
without splitting long lists, repeating headings, or aligning to rigid grid rows.
Resizing preserves the checklist and people draft. Ingredient usage and recipe details
use the single quick preview above the page.
`ShoppingListContent` fetches `GET /menus/:id/shopping_list` only when opened, through
React Query. It displays the week's calendar range, saved people count, categories,
and one checkbox per ingredient. Rails scales and accumulates recipe quantities.
Calculable weights, volumes, pieces, and container counts show an amount. Recipe
container counts work without a known weight; known recipe and buying contents
allow size conversion. Rails sums scaled requirements before rounding to the nearest
whole container, with halves rounded up. If the result would be zero, it preserves
canonical amounts using known contents or fractional counts without contents. Without a profile, matching container units and content snapshots also
retain their counts. Requirements that cannot be fully combined have null
quantity/unit and display only their name. Quantity-less checkbox
labels are just the ingredient name, without null text or fabricated amounts.

There are no per-row calculation details, approximation badges, incomplete
conversion counts, or **Complete reference** actions. Recipes with no ingredients
retain their separate notice because their products are missing. Ingredient-name
previews and recipe navigation remain available. Loading, retry, empty, missing-menu,
and stale-calculation states remain supported.
The list uses a centered supermarket receipt with monospace text, dotted leaders
on every row (including products without quantities),
category separators, and a decorative torn bottom edge. Each ingredient entry
has an accessible checkbox: marking it strikes through its name and quantity,
without changing the category order or hiding quantities. A sticky line beneath
the compact receipt header shows checked progress while scrolling.
The receipt uses readable 14px grocery text and a 44px-wide checkbox label target,
with ingredient names opening recipe usage separately. Checked rows remain in place.
Marks are saved in local browser storage separately for each menu and survive
leaving the screen and reloading. An editor round trip preserves them.
Storage format `comal.shopping-checks.v2.<menu ID>` identifies checklist entries by
ingredient, nullable displayed quantity/unit, configured presentation, and a
legacy false slot. Existing calculated-item keys stay compatible; old incomplete
partial purchases and changed packaged entries do not transfer their marks.
Older v1 formats remain ignored. Changed displayed quantities or buying presentation reset a
mark; unchanged name-only groceries retain their marks. A transition between a
name-only and measured purchase resets its mark. Changes only to internal required
quantity retain a mark when the displayed purchase remains the same.
Refreshing an unchanged list or switching language preserves marks. They are not
sent to the API or synchronized between devices. Unavailable or invalid browser
storage falls back to an in-memory checklist. There are no pantry deductions,
custom categories, or combined-week lists.

The People input and labeled refresh button stay inside an initially collapsed
“Adjust” disclosure in the ticket header, below the week and calculated people
count. Opening and closing the disclosure preserves unsaved values. The refresh
button submits its form and calls `PATCH /menus/:id`
with `people_count`. Positive safe integers are required; saving disables duplicate
submissions and preserves failed drafts. The mutation cancels in-flight list/menu
reads, copies only `people_count` into all cached menu languages (preserving their
localized notices), and refreshes the selected list. Quantities are calculated by
Rails. If refreshing fails after a successful save, the saved count remains in the
input while the ticket displays its previous calculated count with a warning and
retry action. Changing counts never rewrites recipe ingredient amounts.

Ingredient editors load `/shopping_categories` before initializing their draft and
provide a category selector independent of shopping quantity configuration. New
ingredients default to `uncategorized`. Reference data is cached; category loading
and failures offer loading/retry UI. Labels live at
`reference.shopping_categories.<code>` in both translation catalogs, while the API
receives stable English codes. Ingredient names remain user content.

Category/name edits, shopping-profile edits, recipe saves, and menu generation
invalidate cached shopping lists. Lists also refresh when reopened or explicitly
refreshed, so changes to saved people counts made through the API appear there.
Recipe cache updates preserve existing ingredient categories. The responsive receipt
uses the full available page width with the existing Greda theme.

## Browser tests

The committed Playwright suite lives in `client/tests/`, with shared API mocks
and sample data in `client/tests/fixtures/`. Install Chromium once after installing
the npm dependencies (and again when upgrading Playwright):

```bash
cd client
npm ci
npx playwright install chromium
npm run test:browser
```

Playwright starts and stops its own Vite server at `http://127.0.0.1:4173`.
Keep that port free. The test server uses `http://127.0.0.1:4174` as its API URL;
the fixture intercepts those requests, so no Rails server or database is needed.
It always starts a fresh server to avoid accidentally testing a development
server configured with another API URL.

Functional tests run once in desktop Chromium at 1280px. Tests tagged
`@responsive` also run at 320px and 800px; the mobile and tablet projects select
only that tag. These cases check the weekly grid, hero layout, header and
navigation, saved-week overflow, form layout, ingredient overlays, and loading
layout. Date logic, validation, errors, and cache behavior run once rather than
repeating across every width. Playwright defaults to one worker locally and in CI.

Tests fix the date and timezone for predictable weekday ordering and block
external Google Fonts requests. They cover loading and empty states, menu generation and errors,
demo fallback, navigation and responsive layout, meal search/filtering, form
validation, ingredient editing, create/update requests, save errors, and cancelling.
These test client behavior with mocked responses; Rails tests remain responsible
for backend behavior. Other browser engines and PWA installation/offline caching
are not covered by this suite.

Useful commands, from `client/`:

```bash
npm run test:browser -- --project=mobile-chromium
npm run test:browser:ui                      # interactive test runner
```

During active editing, run automated checks only on request. The full suite,
build, and test type check are required before committing client changes, as
described in `client/AGENTS.md`.

Tests fail on uncaught browser errors and retain traces and screenshots on
failure. Generated reports and test results are ignored by Git. Prefer role,
label, and visible-text selectors; add fixtures and tests to this suite when
changing behavior instead of creating temporary browser scripts.

`.github/workflows/client-tests.yml` installs Chromium, builds the client,
type-checks the tests, and runs the suite on pushes and pull requests. It uploads
the HTML report (including failure attachments) as a GitHub Actions artifact.

### Recipe lookup from the receipt

Ingredient names in the ticket open a small usage modal containing only the meals
in that menu that use the ingredient. `IngredientMenuMeals` uses the existing menu
query and matches `ingredient_id` in its scheduled recipes. Repeated occurrences
of a meal appear once; meals in other menus or only in the library are excluded.
This view contains no ingredient form or shopping configuration.

Selecting a meal changes the contents of the single shared preview. Scheduled
days are shown alongside each distinct meal. Back returns to usage and focuses
the selected meal; Close dismisses the whole preview. The host is a bottom sheet
on mobile and a centered modal on desktop.

Edit ingredient leads directly to `/ingredients/:id/edit`; Edit meal leads to
`/meals/:id/edit`. The ticket, unfinished people input, checked entries, and
scroll position survive both editor round trips. Checkboxes remain separate
controls, so opening usage does not check an ingredient. Catalog usage links use
the same single-preview pattern, with all meals using the ingredient rather than
only the selected week's meals.

The header Menu popover contains navigation, recipe creation, and language
controls across screen sizes. Planning is available in Home’s “Next week” section.

### Simple grocery checklist implementation

Regression coverage describes nullable shopping amounts, one ingredient per line,
optional package contents and piece weights, buying-profile validation/retries, dirty-draft protection,
and checklist persistence. Recipe tests cover decimal quantity entry, snapshots, and late
response protection while allowing containers without known contents. Rails service
and HTTP integration tests cover the actual calculation and request contracts;
browser tests continue to use deterministic API mocks.

Implementation received a source/diff review. Before committing, `npm run build`
and `npx tsc -p tsconfig.tests.json` passed. The production build reported a
bundle-size warning. Rails and browser tests were explicitly skipped at the user's
request; actual Rails integration, rendered visual quality, and PWA/offline behavior
remain unverified. No verification servers or browser automation were started.
The requested `bundle exec rails db:migrate` completed successfully and applied
`AllowUnknownShoppingPackageContents`. The previous
[measurement implementation plan](client-ingredient-shopping-plan.md) is historical;
its reference-entry and correction flows are superseded by this checklist design.
