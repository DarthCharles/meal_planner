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

The menu screen owns the bowl hero. Before a menu exists, it explains weekly
planning and contains the single “Plan my week” action. While menus load, that
action is disabled and the hero shows a loading message. Once a menu exists,
the hero becomes a compact overview of today's breakfast, lunch, and dinner,
each on a light card surface within the sage hero, using the same ordered meal
slots as the day cards. It checks the menu's calendar
date range against the local date before presenting meals as today's plan.
If the latest plan is for next week, the overview uses the current week's menu
when available while the grid continues to show the latest plan.
Past or future menus show a saved-menu message; current menus without today's
meals show an unplanned-day message. Only days in the current menu receive the
“Today” highlight. The dated weekly grid and planning action appear below the
overview. Generation failures preserve the current hero and allow retrying.
The meal library has no hero, keeping its heading, search, filters, and add action
at the top of the screen.

Hero meals and weekly day cards reuse `MealRow`: a light button with a meal-time
label, dot, meal name, and caret. Clicking a row or activating it with Enter or
Space opens the meal card through `useMealDialog` and the shared dialog host.
The card shows meal types, description, ingredient quantities and preparation
notes, and an optional recipe link. Missing ingredients have an explicit empty
message. Details use the meal already embedded in the menu and make no additional
API requests. Closing the card restores focus to the row that opened it.

The client falls back to demo data when the API is unavailable so the visual shell can still be developed.

## Structure

```text
client/
  src/
    main.tsx      # React entry point, query/dialog providers, and service worker registration
    App.tsx       # screen state and screen composition
    queryClient.ts # shared server-state cache and request defaults
    queryKeys.ts  # stable cache keys
    components/   # header, navigation, illustrations, and generic dialog host
    features/
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
`useMenus`, `useMeals`, `useMealTypes`, `useUnits`, `useGenerateMenu`,
`useCreateMeal`, and `useUpdateMeal`. Query/mutation status supplies loading,
saving, and API errors; HTTP calls remain in `api.ts`, using `fetch` with the
query's abort signal for cancellable reads.

Query ownership follows the feature that consumes the data:

- `MenuScreen` mounts `useMenus` and `useGenerateMenu`.
- `MealsScreen` mounts `useMeals` when the library is opened.
- `MealDialogContent` mounts `useMealTypes` and `useUnits` only while the modal is open.
  It waits for both queries before mounting `MealForm`, so an edit draft starts
  with the correct meal type IDs. `MealForm` owns create/update mutations and
  unsaved input state.

`App.tsx` owns the shell and screen state; it does not fetch data or pass
API collections through props. Display components such as `MenuView`, `DayCard`,
and `MealsView` receive data and callbacks through props. Nested ingredient
inputs access their form through React Hook Form context.
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

`App.tsx` keeps the current screen in local state. The dialog provider owns the
active dialog. Unsaved form inputs, validation errors, search, and filters stay
local to their components.

Initial query failures use demo data only for the failed resource and show the
demo notice in the screen or modal that owns the query. Successful resources
stay intact. Demo values are presentation
fallbacks and are never stored as successful query results. A failed background
refresh retains cached data and displays the error; failed mutations retain the
existing data and leave the form open for correction or retry.

## Forms

`MealForm` uses React Hook Form's `useForm` with typed default values for create
and edit. Native name, description, URL, quantity, unit, and note fields use
`register`; the meal-time toggle buttons use `Controller` to preserve numeric
meal type IDs. React Query continues to own save requests, pending state, API
errors, and cache updates.

`FormProvider` shares the draft with `IngredientManager`, which uses
`useFormContext` and `useFieldArray`. Rows use React Hook Form's generated IDs
as React keys, so removing a row preserves the other rows' values. Each row
watches its name for the accessible remove-button label. Generated IDs are not
included in the submitted ingredients. On mobile, ingredient names and notes
span the row, with quantity and unit paired beneath the name; tablet and desktop
use a compact single row.

Validation requires a nonblank name and description and at least one meal time.
Named ingredient rows need a quantity of at least 0.001 and a unit; unnamed rows
are excluded from the payload. The form disables native validation so these
rules display consistently through RHF, marking invalid controls and linking
them to an alert summary. Cancel/close unmounts the draft; reopening initializes
a fresh form. Failed saves leave the current values intact.

## Dialogs

`DialogProvider` in `components/dialog/` wraps the application beneath
`QueryClientProvider`. `useDialog` exposes stable `openDialog` and `closeDialog`
actions. The provider supports one active dialog with a required title, optional
eyebrow, and content render function:

```tsx
const { openDialog } = useDialog();
openDialog({
  title: "Confirm action",
  content: ({ close }) => <button onClick={close}>Done</button>,
});
```

`DialogHost` owns the native `<dialog>` shell and opens it with `showModal()`.
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

`features/meals/useMealDialog.tsx` supplies `openCreateMeal` and `openEditMeal`.
Header, navigation, and meal-screen actions call this hook directly. The feature's
`MealDialogContent` owns reference queries and renders the RHF form; the shared
host has no meal-specific logic. Content inherits providers around the dialog
host, so shared dependencies such as React Query must wrap `DialogProvider`.

Dismissal remains available during saves. Closing does not cancel an in-flight
mutation; its cache updates still complete, while a subsequently opened dialog
stays independent. `tests/dialog.spec.ts` covers keyboard/focus behavior,
background inertness, scroll locking, backdrop dismissal, pending requests, and
generic content replacement using the isolated `dialog-harness` fixture.

## Styling with Tailwind

Tailwind CSS v4 runs through `client/postcss.config.js` using the
[`@tailwindcss/postcss` integration](https://tailwindcss.com/docs/installation/using-postcss).
Use Node.js 22.12 or newer (Node 24 recommended) when installing dependencies and building the client.
The existing `npm run dev` and `npm run build` commands compile Tailwind automatically.

Add complete utility class names directly to JSX, for example
`className="flex items-center gap-3"`. Tailwind scans `client/src/` for classes;
avoid constructing class names dynamically, such as `bg-${color}-500`.

The client pins `@darthcharles/greda` 0.2.0. `styles.css` imports Tailwind,
Greda's compiled styles in the `components` layer, its Tailwind 4 tokens, then
`theme.css`. Do not also import Greda CSS in JavaScript. This layer order lets
app utilities override component styles.

The palette and shadows in `theme.css` come from the light Comal theme in
Greda's `.storybook/themes/comal.css`. The app uses Greda's built-in `background`,
`foreground`, `card`, `primary`, `secondary`, `accent`, `muted`, `border`, `input`,
`ring`, `destructive`, and `overlay` tokens with those existing Comal values and
no extra app color tokens. `theme.css` also preserves typography and shape and
defines a loading gradient using `muted` and `background`. Root token changes
update both Greda components and the app shell.

Meal categories use text labels and Greda's secondary badges, rather than
category-specific palettes. Notices use neutral `muted` surfaces; errors in forms
use `destructive`. Today's card uses `accent` with a `primary` border. Reuse these
existing roles before introducing a new color, and discuss any needed palette
extension with the user first. SVG illustrations keep fill and stroke colors
inside their markup. Standalone PWA metadata and the public icon retain their
static brand colors because they load independently of application CSS.

Greda supplies `Input`, `Textarea`, `Card`, and `Badge`. Cards retain the article
role and existing headings. Inputs forward React Hook Form refs, native props,
and validation ARIA attributes. Import UI primitives directly from
`@darthcharles/greda`, using its variants and sizes rather than defining local
primitive wrappers. Buttons use Greda's `default`, `secondary`, and `ghost`
variants and default to `type="button"`; form save actions explicitly use
`type="submit"`. Navigation, filters, meal-time toggles, and ingredient actions
also render Greda buttons directly, with layout classes where needed.

The existing native dialog/provider and native ingredient unit select stay in
place. If adding Greda Select or Tooltip inside a native dialog, put its portal
container inside that dialog so it participates in the modal top layer.

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
