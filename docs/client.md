# Comal client

Comal is a mobile-first React, TypeScript, and Vite PWA backed by the Meal Planner Rails API.

## Local setup

Use Node.js 22.12 or newer. Node 24 is recommended.

```bash
cd client
npm ci
npm run dev
```

Vite serves the app at `http://127.0.0.1:5173/`. Set `VITE_API_URL` to point at a
different Rails API. The default is `http://127.0.0.1:3000`. To start both servers
together, run `bin/dev` from the repository root after installing dependencies.

See the [development guide](development.md) for verification and
[Git hook setup](development.md#git-hooks). From `client/`, use `npm run lint`
and `npm run format:check` to check client source and formatting. Their write
variants are `npm run lint:fix` and `npm run format`.

## Routes and navigation

| Route | Screen |
| --- | --- |
| `/` | Home with today's meals, the current week, and next-week planning |
| `/saved-menus` | Saved weekly menus |
| `/meals` | Meal library with search and meal-type filters |
| `/ingredients` | Shared ingredient catalog with search and usage counts |
| `/menus/:menuId/shopping-list` | Shopping checklist for one menu |
| `/meals/new`, `/meals/:id/edit` | Recipe editors |
| `/ingredients/new`, `/ingredients/:id/edit` | Ingredient editors |

The header links to Home and exposes navigation, recipe creation, and language
selection. Unknown routes show a page-not-found screen.

Quick previews use search parameters on the originating route (`ingredient`,
`ingredientName`, `meal`, and `previewName`). The shared dialog shows one
preview at a time. Back retraces preview steps, and Close dismisses the whole
preview. Preview links can be opened directly.

Editors opened from within the app keep the originating screen mounted, preserving
filters, the selected week, unfinished people-count input, and scroll position.
Returning can reopen the originating preview and restore focus. A direct editor
visit returns to the corresponding library. Unsaved drafts prompt before
navigation or browser unload. Successful saves bypass the prompt.

## Menus

Home fetches `GET /menus/home` with the browser's local calendar date. It shows
today's meals, the full current week, and whether a plan exists for next week.
With no current or next-week plan, Home uses the recipe library status to guide
the user toward adding a recipe or planning a week. Replacing a plan requires
confirmation. If the target week changes during confirmation, the user confirms
the new range separately.

Saved Menus fetches `GET /menus/summaries` and loads the selected week via
`GET /menus/:id`. The archive holds one saved assignment per week. Recipes still
reference the live library, so edits appear in past menus. Persisted generation
notices describe the preferences used at generation time. Both menu screens
offer retry on errors and retain the last successful data during failed refreshes.
Below 760px, Saved Menus opens directly to the selected week and its shopping
list action. **Change week** opens the archive picker. Selecting a week or using
**Back to menu** returns to the menu and restores focus to **Change week**.
At wider widths, the week list and selected menu appear side by side.

Menu dates use date-fns with `@date-fns/utc`. Preserve the calendar day encoded
in API dates. Today and the archive's Upcoming, Current, and Past labels use
the browser's local day. Generation targets the next strictly following Monday
in UTC. Weekday codes stay in English for matching and scheduling.

## Recipes and ingredients

Recipes record servings, meal types, ingredients, and optional preferred days.
An empty preferred-day selection means any day. The recipe editor loads meal types
and units before initializing its draft. The meal library and recipe reference
queries can show labeled demo fallbacks when their initial requests fail.

The ingredient picker reuses the shared catalog. A selected or exact name match
uses its catalog ID. An unmatched name is resolved by Rails when the recipe is
saved. Quantities accept decimals, fractions, and mixed numbers and are submitted
as strings alongside unit codes. Choosing a container in the recipe editor
opens Details. If the ingredient has a saved package size, Details displays
that size. Otherwise it shows optional contents fields. Saving entered
contents sets the ingredient's buying preference using the selected container.
Details includes an Edit ingredient link for saved ingredients. It opens
the ingredient editor in a new tab while keeping the recipe draft open.

The meal library and ingredient catalog use single-column lists. Each meal row
shows its meal times and opens the recipe preview. Each ingredient row shows its
usage count or unused status and opens the usage preview. Open Edit from the
corresponding preview.

My Ingredients loads the catalog on entry. Usage previews list recipes from the
catalog response, then fetch details for the chosen recipe. The ingredient
editor changes the shared name and shopping category. Only unused ingredients
can be deleted, and Rails checks usage again on deletion.

Saved ingredients have a separate buying preference. Recipe measurements are
the default. A custom preference can specify piece, weight, volume, or package
purchases. Piece weight and package contents are optional. Buying preferences
save independently of the name and category draft. The client updates or deletes
the profile at `/ingredients/:id/shopping_profile` and refreshes recipes, menus,
and shopping lists so package rows reflect the current presentation.

## Shopping lists

The current and selected saved menus link to a dedicated shopping list.
Opening the page fetches `GET /menus/:id/shopping_list`. Rails scales recipe
requirements by the menu's people count and calculates grocery quantities.
The client shows one entry per ingredient with a quantity when available.
Recipes with no ingredients have a separate notice. See the
[API reference](api.md) for calculation and request semantics.

Ingredient names open a preview of the recipes using that ingredient in the
selected menu. Each recipe appears once, with its scheduled days. The checkbox
is a separate control. Checked items remain in place and persist in this browser
under `comal.shopping-checks.v2.<menu ID>`. A change to the displayed purchase
quantity, unit, or configured buying presentation resets the corresponding check.
A language change preserves it. Unavailable browser storage falls back to memory.

The Adjust form saves a positive whole people count with `PATCH /menus/:id` and
refreshes the receipt. If saving succeeds and refreshing fails, the form shows the
saved count while the receipt retains its previous calculation with a retry action.

## Architecture

| Location | Responsibility |
| --- | --- |
| `src/main.tsx`, `src/App.tsx` | Providers, PWA registration, shared shell, and routes |
| `src/api.ts`, `src/types.ts` | Rails requests and API-facing types |
| `src/queryClient.ts`, `src/queryKeys.ts` | Shared React Query settings and cache keys |
| `src/features/{menu,meals,ingredients}/` | Screens, forms, and query/mutation hooks |
| `src/features/navigation/`, `src/components/dialog/` | Preview URLs, editor navigation, and native dialog lifecycle |
| `src/i18n/` | Translation catalogs and locale helpers |
| `src/styles.css`, `src/theme.css` | Tailwind and Greda layers and app-level theme settings |
| `public/` | PWA manifests, icons, and service worker |

TanStack React Query owns server data and request state. Screens and editors
load the data they consume, and display components receive data via props.
React Hook Form owns form values and validation. Feature mutation hooks keep
cached details, libraries, and embedded menu data synchronized. The query cache
lives in memory. Recipe and ingredient changes also invalidate shopping lists
when they affect grocery results.

`PreviewController` connects URL previews to `DialogProvider`. `DialogHost`
owns the native dialog, Escape and backdrop dismissal, scroll locking, and
focus restoration. Async dialog content uses the instance-bound `close` so
a late completion cannot dismiss a newer dialog. Editor draft protection lives
with the router in `features/navigation/`.

## Languages

The header switches between English and Spanish. The choice persists under
`comal.locale` and synchronizes across tabs. With no saved choice, the browser's
first supported language wins, with English as the fallback.

Copy lives in the nested TypeScript catalogs `src/i18n/en.ts` and
`src/i18n/es.ts`. Both catalogs share the same key structure. Use `useI18n()`
and `t()` for UI strings, with `%{name}` interpolation and `one`/`other` plural
entries. Dates and numbers format as `en-US` or `es-MX`.

Requests send `Accept-Language`. Menu queries include the locale in their cache
keys because Rails renders persisted notices in the requested language. Saves
that update shared recipes synchronize both languages' cached menus. User-entered
content and API codes keep their original values.

## Styling and PWA

Use Greda's Comal theme and semantic tokens with Tailwind CSS v4 utilities.
Import Greda components directly and use its named spacing and typography
roles. See [DESIGN.md](../DESIGN.md) for the design system and
[client instructions](../client/AGENTS.md) for implementation rules.

Production hosting serves `client/dist/index.html` for client navigation,
including deep links, while serving assets normally and routing API traffic to
the configured Rails origin. The production service worker caches the app shell
and both language manifests. When the flower artwork changes, regenerate the 180px iOS
touch icon and the 192px and 512px manifest icons from `public/comal-icon.svg`.

## Browser tests

Install Playwright's Chromium from `client/` with
`npx playwright install chromium`. The suite in `client/tests/` uses shared
API mocks and starts its own Vite server on port 4173. It intercepts API traffic
to port 4174. Functional tests run in desktop Chromium, with `@responsive`
cases also running at mobile and tablet widths.

Use `npm run test:browser` for the browser suite and
`npm run test:browser:ui` for the interactive runner. See
[client instructions](../client/AGENTS.md#verification-expectations) for when
to run checks. Rails integration, PWA installation and offline behavior, and
other browser engines require separate verification.
