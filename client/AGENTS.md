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
- Delegate shared Greda component bugs and reusable component requests to the
  user-level `greda_maintainer` agent, whose source repository is `../greda`
  relative to the Meal Planner repository root. Investigate the library before
  adding consumer overrides for its behavior. Give the agent reproduction
  details, installed package version, acceptance criteria, and explicit ownership
  of Greda files; keep Meal Planner changes with the client agent. If the custom
  agent is unavailable in the current session, use a sub-agent with the same
  role and repository instructions. Keep investigation-only tasks read-only.
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
- Run functional behavior coverage once in the desktop Chromium project. Add
  `tag: "@responsive"` only for tests with viewport-dependent layout, navigation,
  or overlay assertions; these also run at mobile (320px) and tablet (800px).
  Keep those responsive checks across all three widths without repeating date,
  validation, API-error, or cache scenarios at each width.
- Before adding a test, identify the distinct failure it catches. Extend a
  related flow when setup and behavior overlap; avoid testing Greda internals
  or exact theme values in this consumer suite.
- Inspect failure screenshots, traces, and error context before changing tests.
  Fix the cause rather than hiding failures with retries or weaker assertions.
  Once relevant checks pass, repeat them only when further changes or unresolved
  concerns justify it.
- Browser tests use mocked API responses and do not verify Rails integration.
  Keep backend coverage in the Rails suite and update fixtures when API contracts
  change. PWA installation/offline caching and other browser engines require
  separate verification; do not imply this suite covers them.

## Verification expectations

Follow the root `AGENTS.md` opt-in verification policy. During normal development,
review code and diffs and update tests without executing automated checks. Do not
start Playwright, browser automation, builds, type checks, linters, or verification
servers during active editing unless the user explicitly requests verification. Do not ask to run them
after each change; state that they were not run.

When asked to test without a broader scope, run the smallest relevant browser
test with `--workers=1 --project=desktop-chromium`. Run commands sequentially;
do not start background or watch runs. Other viewports and the full suite require
an explicit request for that scope, except for mandatory pre-commit verification.

Before committing client changes, or when the user explicitly requests full
verification, run from `client/`. A commit request authorizes these required
checks; they must pass before committing:

```bash
npm run build
npm run test:browser -- --workers=1
```

When browser tests or their configuration changed, include
`npx tsc -p tsconfig.tests.json` in pre-commit or explicitly requested full verification.
Focused test requests do not authorize additional builds or type checks.
Do not repeat successful checks without a relevant new change, and do not treat
the end of an agent turn as final verification.

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
