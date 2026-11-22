# Development guide

## Agent workflow

The root [AGENTS.md](../AGENTS.md) contains shared rules and coordination
guidance. The backend agent reads [backend instructions](agents/backend.md)
for Rails work across the repository. The client agent reads
[client/AGENTS.md](../client/AGENTS.md) for work in `client/` and the client
documentation. Read the relevant instructions even when starting at the root.

For changes spanning both areas, define the API contract and acceptance criteria
first, assign non-overlapping files to each agent, and coordinate updates to
shared documentation and configuration. Run both sets of required checks and
verify Rails integration separately when necessary; browser tests use mocks.
Single-area tasks only need the responsible role. These instruction files do not
start agent processes or create persistent agent instances.

## Rails environment

The Rails 8.1 app requires Ruby 3.4.12 and Bundler 2.7.2. With RVM:

```bash
source "$HOME/.rvm/scripts/rvm"
rvm install 3.4.12
rvm use ruby-3.4.12
gem install bundler -v 2.7.2
```

On macOS, use OpenSSL 3 when compiling Ruby. If an older RVM installation
selects OpenSSL 1.1, install `openssl@3` with Homebrew and pass
`--with-openssl-dir="$(brew --prefix openssl@3)"` to `rvm install`.

Install dependencies and prepare the database:

```bash
bundle install
bin/rails db:prepare
bin/rails db:seed
```

Run the API:

```bash
bin/rails server -b 127.0.0.1 -p 3000
```

## Run API and client together

After installing the Rails and client dependencies, start both development
servers from the repository root:

```bash
bin/dev
```

Press `Ctrl+C` to stop both processes. The default ports are `3000` for Rails
and `5173` for Vite. They can be changed with environment variables, for
example:

```bash
API_PORT=3001 CLIENT_PORT=5174 bin/dev
```

## Client environment

```bash
cd client
npm install
npm run dev
```

Build the client for production:

```bash
npm run build
```

Generated client files in `node_modules/`, `dist/`, and TypeScript build metadata are ignored by Git.

## Git hooks

Enable the tracked hooks once per clone, from the repository root:

```bash
git config --local core.hooksPath .githooks
```

When a commit includes staged files under `client/`, the pre-commit hook runs
ESLint with `--fix --max-warnings=0` on staged JavaScript and TypeScript files,
then Prettier with `--write --ignore-unknown` on staged client files. Both tools
use the client's existing configuration and ignore rules. Deleted files are
skipped. Install client dependencies first. Other commits skip these tools.

Stage or stash unstaged changes in files included in the commit; the hook stops
if any remain so fixes do not mix with unfinished work. Unrelated unstaged files
are left alone. ESLint errors or warnings and Prettier errors block the commit.
If either tool applies fixes, review and stage them, then commit again.
The hook never stages changes automatically. The full verification
requirements in `AGENTS.md` still apply before committing.

## Tests

Run the Rails test suite with the pinned Ruby version:

```bash
bundle exec rails test
RAILS_ENV=test bundle exec rails zeitwerk:check
```

The backend tests cover API response shapes, meal writes and validation,
ingredients, reference data, nested menus, UTC timestamps, CORS, and menu generation.
Rails tests default to one worker to limit local CPU use. API contract tests own
basic ingredient writes and association preservation; ingredient-specific tests
cover catalog identity, clearing, malformed inputs, and transactional rollback.
Service tests own scheduling rules; controller tests cover HTTP responses and
saved-menu ordering. Keep these distinct rather than repeating the same happy
path at each layer. Generated test files with no executable tests are omitted.
Pure next-Monday calculations live separately from scheduling tests so they do
not create a database meal pool.

The menu-generation tests cover:

- Seven-day, 21-meal menu creation.
- Small pools with repeats and impossible schedules.
- Preferred days, minimal fallback notices, and variety after preferences.
- Atomic replacement and preservation of existing menus on failure.
- Replacing an existing menu for a week.
- Finding the next Monday.

GitHub Actions runs Rails tests and eager-loading checks independently of the
client workflow. It initializes the test database with
`RAILS_ENV=test bundle exec rails db:create db:schema:load` so tests start without
sample data. Avoid `db:prepare` for this step: it loads `db/seeds.rb` when creating
a database, causing duplicate ingredient errors in tests that create their own
records. To reset a previously seeded local test database, run the same schema
load command; it replaces all test data.

Client browser tests mock API responses; they do not test the Rails integration.

After changing Ruby or dependencies, stop any existing `bin/dev` process, select
the pinned Ruby, run `bundle install`, and restart `bin/dev`. A running server
continues using the Ruby and gems with which it started.

## Ingredient measurements and shopping

Apply `bundle exec rails db:migrate`, then `bundle exec rails db:seed`.
The November 21 measurement rebuild intentionally deletes prototype recipe
ingredient rows, old shopping profiles/equivalences, and units before installing
the new standard. Meals and menus remain; seeds repopulate sample recipe rows.
The rebuild is irreversible; no legacy compatibility or data backfill is provided.
The schema dump supports fresh setup with `db:prepare` followed by seeds.

The following unit-code migration replaces the Spanish codes with `jar`, `piece`,
`cup`, `tablespoon`, and `teaspoon`, preserving IDs and their relationships.

The standard is g/kg, ml/l, a 240 ml cup, 15 ml tablespoon, 5 ml teaspoon, and
whole pieces. Containers have no universal size. Recipe container contents are
optional and stay separate from the ingredient's habitual buying presentation.
Recipes require explicit `servings` on creation.

The client only configures how an ingredient is bought through
`PUT /ingredients/:id/shopping_profile`. Package contents are optional. Apply the
`AllowUnknownShoppingPackageContents` migration before using these profiles.
Existing measurement references and their API remain supported, but the client
no longer exposes a reference form. Removing shopping setup retains references.

Seeds contain a sample mayonnaise reference of 13 g per 15 ml based on the linked
Hellmann's product label and an approximate 148 g medium-onion edible weight from
the FDA. Sources and limitations are stored with each reference. The 390 g jar
and 140 g tuna can are chosen demonstration presentations, not universal product
sizes. Other ingredients use natural buying units without invented densities.
The current-week sample menu includes a recipe with an explicit can size.
Seeded recipe quantities are explicitly for one person; they are demonstration
recipes rather than nutritional guidance.

The checklist contains one line per ingredient. Packages appear by name only;
calculable pieces round upward and compatible mass/volume totals remain in g/ml.
When a conversion is unavailable, the ingredient also appears by name only.
Original recipe quantities remain stored. Calculation is local and makes no
external calls. Nullable checklist amounts are shared by Rails and the client;
conversion metadata is not displayed. There is no shopping-adjustment step.

## Scheduled generation

The backend also exposes a Rake task:

```bash
bin/rake menu:generate
```

It generates the next Monday–Sunday menu using the same service as the API endpoint.
For a new week, the people count defaults to `1`. Regenerating an existing week
preserves its saved count. Set a different count through `PATCH /menus/:id` or
by sending `people_count` to `POST /menus/generate`; there is no global household
default. Generation replaces the menu ID while keeping these count semantics.
