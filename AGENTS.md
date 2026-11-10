# AGENTS.md

## Project overview

Meal Planner is a Rails 8.1 API with a SQLite database and a React/TypeScript/Vite
responsive PWA in `client/`. The application manages meals, meal types, days,
and generated weekly menus.

The API currently has no authentication. Data is shared locally, so do not
introduce ownership or authorization assumptions unless the task explicitly
requires them.

## Agent responsibilities

- Before backend work, read [backend instructions](docs/agents/backend.md).
  Rails work includes `app/`, `config/`, `db/`, `lib/`, `test/`, root Rails
  entry points, dependencies, and backend CI/setup files.
- Before client work, read [client instructions](client/AGENTS.md), even when
  starting from the repository root. The client agent owns `client/` and
  `docs/client.md`.
- For work spanning both sides, the coordinating agent defines the API contract
  and acceptance criteria, assigns backend and client work to their respective
  agents when delegating, and verifies the combined result. Give each agent
  explicit file ownership; coordinate shared documentation and configuration
  changes so agents do not edit the same files concurrently.
- Agree on request/response shapes, errors, date semantics, and reference data
  before implementing dependent changes. Backend changes belong with Rails
  tests; update client types, API calls, and mocked fixtures to match the final
  contract. Passing mocked browser tests does not establish Rails integration.
- Single-area tasks can be completed by the responsible agent without launching
  another agent. These files define working roles and instructions; they do not
  launch agent processes or configure persistent agent instances.

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

## Shared development guidelines

- Use English for identifiers, variables, comments, log messages, and other
  code-facing text.
- Update the relevant file under `docs/` when changing routes, data models,
  setup, or client behavior.
- Do not commit secrets, local `.env` files, generated `client/dist/` output,
  `node_modules/`, or generated Playwright reports and test results.

To run both development servers after installing their dependencies, use
`bin/dev` from the repository root. Runtime requirements, area-specific commands,
and implementation rules live in the backend and client instructions above.

## Verification expectations

- During active editing, automated verification is opt-in because local runs slow down the user's
  computer. Do not run tests, browser automation, builds, type checks, linters,
  or verification servers unless the user explicitly requests verification.
  Making a change or finishing an agent turn does not authorize these commands.
- Before committing, the relevant full verification suites must pass for the
  changes being committed. A request to commit authorizes these required checks;
  do not ask for separate permission. Do not commit if required checks fail or
  cannot run. This is the exception to the active-editing opt-in rule.
- During normal development, review the code and diff and update relevant tests
  without executing them. Report that automated checks were not run; do not ask
  for permission to run them after each change.
- When the user requests tests without specifying scope, run only the smallest
  relevant check. Use one worker and one browser project for Playwright (desktop
  by default). Run verification commands sequentially, without background runs
  or watch mode. Run broader checks only when explicitly requested or required
  before committing.
- Full verification runs before committing or on an explicit request for a full run. Backend
  verification is `bundle exec rails test` from the
  repository root. Client verification is `npm run build` and
  `npm run test:browser -- --workers=1` from `client/`, plus
  `npx tsc -p tsconfig.tests.json` when browser tests or their configuration changed.
- Full verification for work spanning both sides covers both sets of checks.
  Validate actual Rails integration separately when the change requires it;
  browser mocks alone do not cover it.
- Documentation-only edits do not trigger checks during active editing; the
  pre-commit requirement still applies, using the suites for the documented areas.

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
