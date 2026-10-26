# AGENTS.md

## Project overview

Meal Planner is a Rails 6 API with a SQLite database and a React/TypeScript/Vite
responsive PWA in `client/`. The application manages meals, meal types, days,
and generated weekly menus.

The API currently has no authentication. Data is shared locally, so do not
introduce ownership or authorization assumptions unless the task explicitly
requires them.

## Repository layout

- `app/`: Rails models, controllers, services, and jobs.
- `config/routes.rb`: API routes.
- `db/migrate/`: database migrations; `db/seeds.rb` contains development data.
- `test/`: Rails unit, controller, service, and channel tests.
- `lib/tasks/`: custom Rake tasks, including menu generation.
- `client/src/`: React screens, API client, TypeScript types, and styles.
- `client/tests/`: Playwright browser tests and shared API fixtures.
- `client/playwright.config.ts`: browser projects and test server configuration.
- `docs/`: database, API, client, and development documentation.

## Requirements

- Ruby 3.0.0 (the required version is declared in `Gemfile`).
- Bundler, Node.js 20 or newer/npm, and SQLite.
- Playwright Chromium for client browser tests (`cd client && npx playwright install chromium`).

## Common commands

From the repository root:

```bash
bundle install
bin/rails db:prepare
bin/rails db:seed
bin/rails server -b 127.0.0.1 -p 3000
bin/dev
bundle exec rails test
bin/rake menu:generate
```

In a second terminal:

```bash
cd client
npm install
npm run dev
npm run build
npm run test:browser
```

The client uses `VITE_API_URL` when set, and otherwise targets
`http://127.0.0.1:3000`.

## Development guidelines

- Use English for identifiers, variables, comments, log messages, and other
  code-facing text.
- Keep domain logic in models or service objects; avoid putting business rules
  in controllers.
- Reuse `MenuGenerationService` for weekly menu generation rather than
  duplicating its logic in controllers or Rake tasks.
- When changing the database schema, add a new migration. Do not edit an old
  migration that may already have run.
- Update Rails tests for backend behavior changes and run the full test suite.
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
- Preserve the mobile-first responsive behavior and existing visual language
  when modifying the client.
- Update the relevant file under `docs/` when changing routes, data models,
  setup, or client behavior.
- Do not commit secrets, local `.env` files, generated `client/dist/` output,
  `node_modules/`, or generated Playwright reports and test results.

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

For backend changes, run:

```bash
bundle exec rails test
```

For client changes, run:

```bash
cd client
npm run build
npm run test:browser
```

When changing browser tests or their configuration, also type-check them from
`client/` with `npx tsc -p tsconfig.tests.json`. A single project or test can be
used while iterating, but run the full browser suite before completing client
changes. Documentation-only changes do not require application tests.

Playwright starts its own Vite server on port 4173 and intercepts its API traffic
to port 4174. Keep port 4173 free; do not start a separate test server or point
tests at a shared development server.

For visual inspection, use `npm run test:browser:ui` for the interactive runner
and step snapshots. To watch live browser actions, use
`npm run test:browser -- --headed --workers=1 --project=desktop-chromium`.
Use `--debug` instead of `--headed` to pause and step through actions.

Report the commands run, results, and material coverage limits. If a command
cannot run because a required runtime, dependency, browser, or permission is
unavailable, explain the limitation and list the checks completed. Do not claim
CI passed based only on a local run.

## Documentation references

- `README.md`: setup and high-level project overview.
- `docs/development.md`: local development workflow and scheduled generation.
- `docs/api.md`: API reference.
- `docs/database.md`: database model and ER diagram.
- `docs/client.md`: client structure and current flows.
