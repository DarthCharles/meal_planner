# Backend agent instructions

Read the root `AGENTS.md` first. This file is required for backend work because
Rails code spans several sibling directories rather than one backend directory.
All paths below are relative to the repository root.

## Ownership

The backend agent owns `app/`, `config/`, `db/`, `lib/`, `test/`, Rails entry
points and dependency files, and backend development and CI configuration.
It also owns `docs/api.md`, `docs/database.md`, and backend sections of
`docs/development.md` and `README.md`.

The client agent owns `client/` and `docs/client.md`. Coordinate request and
response changes with that agent, including errors, reference data, nested menu
meals, dates, and ingredient payloads. Read `client/AGENTS.md` before making any
client changes yourself.

## Setup and commands

Use Ruby 3.4.12 (declared in `Gemfile`), Bundler, and SQLite. Run from the
repository root:

```bash
bundle install
bin/rails db:prepare
bin/rails db:seed
bin/rails server -b 127.0.0.1 -p 3000
bundle exec rails test
bin/rake menu:generate
```

See `docs/development.md` for runtime setup, CI database preparation, and
scheduled menu generation. Client browser tests use mocks and do not verify
Rails integration.

## Development guidelines

- Keep domain logic in models or service objects; avoid putting business rules
  in controllers.
- Reuse `MenuGenerationService` for weekly menu generation rather than
  duplicating its logic in controllers or Rake tasks.
- When changing the database schema, add a new migration. Do not edit an old
  migration that may already have run.
- Update Rails tests for backend behavior changes. Execute them on user request
  during active editing, and run the full suite before committing, following
  the root verification policy.
- Give each test a distinct failure to catch. Keep HTTP contracts in integration
  tests and scheduling rules in service tests; consolidate repeated happy paths
  while retaining transactional and validation edge cases. Keep pure date tests
  separate from database-heavy setup. Do not add generated placeholder tests.

## Verification expectations

For backend behavior changes, update the appropriate Rails model, controller,
service, or other tests without running them during normal development. Tests
and other automated checks require an explicit user request during active editing
under the root `AGENTS.md` policy. When asked to test, use the smallest relevant test scope and
run commands sequentially. Run the full suite from the repository root only
before committing backend changes or when the user explicitly requests a full run.
A commit request authorizes the required checks; they must pass before committing:

```bash
bundle exec rails test
```

Keep backend coverage in Rails tests. When an API contract changes, provide the
client agent with the final request/response examples and validation results so
its types, API calls, fixtures, and browser tests remain consistent.
