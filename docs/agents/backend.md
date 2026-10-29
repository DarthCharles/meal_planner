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
- Update Rails tests for backend behavior changes and run the full test suite.

## Verification expectations

For backend behavior changes, update the appropriate Rails model, controller,
service, or other tests and run the full suite from the repository root:

```bash
bundle exec rails test
```

Keep backend coverage in Rails tests. When an API contract changes, provide the
client agent with the final request/response examples and validation results so
its types, API calls, fixtures, and browser tests remain consistent.
