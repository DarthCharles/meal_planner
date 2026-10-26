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

## Current flows

- View the current menu.
- Reorder the weekly grid so the current day appears first.
- Generate a weekly menu.
- Browse and filter meals.
- Add a meal to the library.
- Install the app as a PWA.

The client falls back to demo data when the API is unavailable so the visual shell can still be developed.

## Structure

```text
client/
  src/
    main.tsx      # React entry point, query provider, and service worker registration
    App.tsx       # screen/dialog state and screen composition
    queryClient.ts # shared server-state cache and request defaults
    queryKeys.ts  # stable cache keys
    components/   # header, navigation, buttons, and illustrations
    features/
      menu/       # weekly menu screen, day cards, and query/mutation hooks
      meals/      # library, form, ingredients, query/mutation hooks, and meal type styles
    demoData.ts   # fallback meals and menu for offline development
    api.ts        # Rails API requests
    types.ts      # API-facing TypeScript types
    styles.css    # Tailwind imports, theme tokens, and global defaults
  public/
    manifest.webmanifest
    sw.js
```

The visual system uses a warm cream canvas, terracotta actions, golden meal accents, green garnish cues, and a bowl-based Comal mark.

## Server state and hooks

TanStack React Query manages server data. `main.tsx` supplies the shared
`QueryClientProvider`; `queryClient.ts` configures a 30-second stale time and
disables automatic retries for reads and writes. Stale queries can refetch on
window focus or reconnection. Meal types and units remain fresh for five minutes.
The cache lives in memory and is not persisted for offline use.

Feature hooks in `features/menu/queries.ts` and `features/meals/queries.ts` expose
`useMenus`, `useMeals`, `useMealTypes`, `useUnits`, `useGenerateMenu`,
`useCreateMeal`, and `useUpdateMeal`. Query/mutation status supplies loading,
saving, and API errors; HTTP calls remain in `api.ts`, using `fetch` with the
query's abort signal for cancellable reads.

Query ownership follows the feature that consumes the data:

- `MenuScreen` mounts `useMenus` and `useGenerateMenu`.
- `MealsScreen` mounts `useMeals` when the library is opened.
- `MealFormModal` mounts `useMealTypes` and `useUnits` only while the modal is open.
  It waits for both queries before mounting `MealForm`, so an edit draft starts
  with the correct meal type IDs. `MealForm` owns create/update mutations and
  unsaved input state.

`App.tsx` owns the shell and screen/dialog state; it does not fetch data or pass
API collections through props. Display components such as `MenuView`, `DayCard`,
`MealsView`, and `IngredientManager` receive data and callbacks through props.
Opening the app requests only `/menus`; opening the library adds `/meals`, and
opening a form adds `/meal_types` and `/units`. Fresh cached data is reused when
revisiting a screen or reopening a form. Menu planning controls live on the menu
screen; the library has its own heading and add/edit actions.

Successful mutations update the cache from the API response. Generating a menu
puts it first in the menu list. Saving a meal updates the library and replaces
that meal wherever it appears in cached menus. In-flight reads are cancelled
before applying those responses so older data cannot overwrite the update.
If the meal list has never loaded, it is fetched on the next library visit rather
than being replaced with a partial list containing only the saved meal. Creating
a meal from the menu does not trigger an unused library request.

`App.tsx` keeps two local states: the current screen and a dialog state of
`closed`, `create`, or `edit` (with the selected meal). Unsaved form inputs,
validation errors, search, and filters stay local to their components.

Initial query failures use demo data only for the failed resource and show the
demo notice in the screen or modal that owns the query. Successful resources
stay intact. Demo values are presentation
fallbacks and are never stored as successful query results. A failed background
refresh retains cached data and displays the error; failed mutations retain the
existing data and leave the form open for correction or retry.

## Styling with Tailwind

Tailwind CSS v4 runs through `client/postcss.config.js` using the
[`@tailwindcss/postcss` integration](https://tailwindcss.com/docs/installation/using-postcss).
Use Node.js 20 or newer when installing dependencies and building the client.
The existing `npm run dev` and `npm run build` commands compile Tailwind automatically.

Add complete utility class names directly to JSX, for example
`className="flex items-center gap-3"`. Tailwind scans `client/src/` for classes;
avoid constructing class names dynamically, such as `bg-${color}-500`.

Components use Tailwind utilities directly in JSX, including responsive, hover,
focus, and selected states. `components/Button.tsx` shares the primary, secondary,
and ghost action styles. Meal time colors use maps of complete class names in
`features/meals/mealTypes.ts` so Tailwind can detect every variant.

`styles.css` contains the Tailwind import (including Preflight), theme colors,
fonts, the loading shimmer animation, and global body/button defaults. Keep
component styling in JSX rather than adding component selectors or `@apply`
wrappers to this file.

The theme preserves the existing layout breakpoints: `tablet:` at 641px,
`desktop:` at 760px, and `wide:` at 901px. Layouts start with mobile utilities
and add these variants for larger screens.

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

Each test runs in Chromium at 320px, 800px, and 1280px widths. Tests fix the date
and timezone for predictable weekday ordering and block external Google Fonts
requests. They cover loading and empty states, menu generation and errors,
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

Tests fail on uncaught browser errors and retain traces and screenshots on
failure. Generated reports and test results are ignored by Git. Prefer role,
label, and visible-text selectors; add fixtures and tests to this suite when
changing behavior instead of creating temporary browser scripts.

`.github/workflows/client-tests.yml` installs Chromium, builds the client,
type-checks the tests, and runs the suite on pushes and pull requests. It uploads
the HTML report (including failure attachments) as a GitHub Actions artifact.
