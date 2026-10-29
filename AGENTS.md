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

- Backend changes: run `bundle exec rails test` from the repository root.
- Client changes: run `npm run build` and `npm run test:browser` from `client/`.
  Also run `npx tsc -p tsconfig.tests.json` when changing browser tests or their
  configuration.
- Work spanning both sides must satisfy both sets of checks. Validate actual
  Rails integration separately when the change requires it; browser mocks alone
  do not cover it.
- Documentation-only changes do not require application tests.

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
