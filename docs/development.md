# Development guide

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

## Tests

Run the Rails test suite with the pinned Ruby version:

```bash
bundle exec rails test
RAILS_ENV=test bundle exec rails zeitwerk:check
```

The backend tests cover API response shapes, meal writes and validation,
ingredients, reference data, nested menus, UTC timestamps, CORS, and menu generation.
The menu-generation tests cover:

- Seven-day, 21-meal menu creation.
- Insufficient meal pools.
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

## Scheduled generation

The backend also exposes a Rake task:

```bash
bin/rake menu:generate
```

It generates the next Monday–Sunday menu using the same service as the API endpoint.
