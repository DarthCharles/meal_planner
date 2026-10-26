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
    main.tsx      # React entry point and service worker registration
    App.tsx       # shared state, data loading, and screen composition
    components/   # header, navigation, buttons, and illustrations
    features/
      menu/       # weekly menu screen and day cards
      meals/      # meal library, form, ingredients, and meal type styles
    demoData.ts   # fallback meals and menu for offline development
    api.ts        # Rails API requests
    types.ts      # API-facing TypeScript types
    styles.css    # Tailwind imports, theme tokens, and global defaults
  public/
    manifest.webmanifest
    sw.js
```

The visual system uses a warm cream canvas, terracotta actions, golden meal accents, green garnish cues, and a bowl-based Comal mark.

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
