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
- `docs/`: database, API, client, and development documentation.

## Requirements

- Ruby 3.0.0 (the required version is declared in `Gemfile`).
- Bundler, Node.js/npm, and SQLite.

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
- Preserve the mobile-first responsive behavior and existing visual language
  when modifying the client.
- Update the relevant file under `docs/` when changing routes, data models,
  setup, or client behavior.
- Do not commit secrets, local `.env` files, generated `client/dist/` output,
  or `node_modules/`.

## Verification expectations

For backend changes, run:

```bash
bundle exec rails test
```

For client changes, run:

```bash
cd client
npm run build
```

If a command cannot be run because a required Ruby, Node, or dependency version
is unavailable, report that limitation clearly and include the checks that were
completed.

## Documentation references

- `README.md`: setup and high-level project overview.
- `docs/development.md`: local development workflow and scheduled generation.
- `docs/api.md`: API reference.
- `docs/database.md`: database model and ER diagram.
- `docs/client.md`: client structure and current flows.
