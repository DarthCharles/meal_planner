# Client agent instructions

Read the root `AGENTS.md` first. These instructions apply to all work under
`client/`, including when the agent starts from the repository root.

## Ownership

The client agent owns `client/` and `docs/client.md`: React screens, UI
components, forms, query hooks, API-facing types, styles, PWA assets, build
configuration, and Playwright tests. Coordinate API contract changes with the
backend agent before changing request or response assumptions. Backend guidance
is in `docs/agents/backend.md` at the repository root.

## Setup and commands

Use Node.js 22.12 or newer/npm; Node 24 is recommended. Run from `client/`:

```bash
npm install
npx playwright install chromium
npm run dev
npm run build
npm run test:browser
```

The client uses `VITE_API_URL` when set, and otherwise targets
`http://127.0.0.1:3000`.

## Development guidelines

- Keep API-facing TypeScript types in `client/src/types.ts` and HTTP calls in
  `client/src/api.ts`.
- Manage client server state with React Query hooks in feature `queries.ts`
  files, using the shared query client and keys. Keep query data and request
  status out of local `useState`; reserve local state for UI interactions and
  unsaved form inputs. Keep mutation cache updates in hooks, including updating
  meals embedded in cached menus.
- Call query hooks in the screen or form that consumes the data, so inactive
  features do not fetch eagerly. Keep `App.tsx` focused on the shell and UI
  state; pass data and callbacks to display components through props. Wait for
  form reference data before initializing an edit draft, and test which requests
  happen on initial load, navigation, and opening a form.
- Destructure React Query hook results at the call site. Alias data, mutation
  functions, status, and errors clearly when using multiple hooks; select only
  the fields needed rather than using rest destructuring.
- Use React Hook Form for form values and client validation. Register native
  inputs, use `Controller` for custom controlled inputs, and use `useFieldArray`
  with its generated row IDs for dynamic ingredients. Nested form fields can
  use `FormProvider`/`useFormContext`; avoid mirroring their values in `useState`.
  Keep API mutations and cache synchronization in React Query hooks.
- Open dialogs through the generic `useDialog` API and `DialogProvider`;
  feature hooks such as `useMealDialog` supply feature content. Keep the native
  dialog shell, focus restoration, dismissal, and scroll locking in `DialogHost`.
  Use the instance-bound `close` supplied to dialog content for async completion,
  and keep form state and API hooks in the content. Cover keyboard/focus and
  replacement behavior when changing the shared dialog implementation.
- Import UI primitives directly from Greda and use its existing Storybook Comal
  palette through Greda's standard semantic tokens.
  Keep illustration colors inside SVGs; discuss any additional UI colors with
  the user before adding them.
- Preserve the mobile-first responsive behavior and existing visual language
  when modifying the client.

## Testing practices

- Use the committed Playwright suite in `client/tests/` for client behavior
  checks. Extend its tests and fixtures instead of rebuilding temporary browser
  scripts each session.
- Add or update regression tests for changed user behavior: navigation, menus,
  search/filtering, meal forms, ingredients, validation, loading, and error states.
  Test observable outcomes and submitted API payloads rather than implementation
  details or exact Tailwind class strings.
- Reuse `client/tests/fixtures/app.ts` and `data.ts`. Keep tests independent,
  fix dates/timezones where relevant, and mock API responses deterministically.
  Browser tests must not depend on a running Rails server, external fonts, or
  modify the development database.
- Prefer accessible role, label, and visible-text selectors. Use Playwright's
  waiting assertions and controlled responses for pending states; avoid arbitrary
  sleeps and fragile CSS selectors.
- Preserve coverage across the configured mobile (320px), tablet (800px), and
  desktop (1280px) Chromium projects. Check responsive layout and overflow when
  changing UI structure or styling.
- Inspect failure screenshots, traces, and error context before changing tests.
  Fix the cause rather than hiding failures with retries or weaker assertions.
  Once relevant checks pass, repeat them only when further changes or unresolved
  concerns justify it.
- Browser tests use mocked API responses and do not verify Rails integration.
  Keep backend coverage in the Rails suite and update fixtures when API contracts
  change. PWA installation/offline caching and other browser engines require
  separate verification; do not imply this suite covers them.

## Verification expectations

For client changes, run from `client/`:

```bash
npm run build
npm run test:browser
```

When changing browser tests or their configuration, also type-check them from
`client/` with `npx tsc -p tsconfig.tests.json`. A single project or test can be
used while iterating, but run the full browser suite before completing client
changes.

Playwright starts its own Vite server on port 4173 and intercepts its API traffic
to port 4174. Keep port 4173 free; do not start a separate test server or point
tests at a shared development server.

For visual inspection, use `npm run test:browser:ui` for the interactive runner
and step snapshots. To watch live browser actions, use
`npm run test:browser -- --headed --workers=1 --project=desktop-chromium`.
Use `--debug` instead of `--headed` to pause and step through actions.

Client browser tests mock the API. Coordinate fixture updates with backend
contract changes and report Rails integration, PWA, and browser-engine coverage
limits explicitly. See `../docs/client.md` for the current flows and structure.
