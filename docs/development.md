# Development guide

## Rails environment

The Rails app requires Ruby 3.0.0. With RVM:

```bash
source /Users/carloscontreras/.rvm/scripts/rvm
rvm use ruby-3.0.0
```

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

Run the Rails test suite with Ruby 3.0:

```bash
bundle exec rails test
```

The menu-generation tests cover:

- Seven-day, 21-meal menu creation.
- Insufficient meal pools.
- Replacing an existing menu for a week.
- Finding the next Monday.

## Scheduled generation

The backend also exposes a Rake task:

```bash
bin/rake menu:generate
```

It generates the next Monday–Sunday menu using the same service as the API endpoint.
