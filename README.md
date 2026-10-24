# Meal Planner

Meal Planner is a Rails API and responsive PWA for creating meals and generating weekly menus.

The repository currently contains:

- A Rails 6 API backed by SQLite.
- A React, TypeScript, and Vite consumer client in [`client/`](client/).
- Random weekly menu generation based on meal types.
- A mobile-first PWA interface that also adapts to desktop screens.

The current prototype does not have authentication yet. API data is therefore shared locally while the multi-user ownership model is planned for a later phase.

## Requirements

- Ruby 3.0.0
- Bundler
- Node.js and npm for the client
- SQLite

The Gemfile is the source of truth for the required Ruby version. If you use RVM and Ruby 3.0.0 is already installed:

```bash
rvm use ruby-3.0.0
```

## Install and run

Set up the Rails API:

```bash
bundle install
bin/rails db:prepare
bin/rails db:seed
```

Start the API:

```bash
bin/rails server -b 127.0.0.1 -p 3000
```

In another terminal, install and start the client:

```bash
cd client
npm install
npm run dev
```

To start the API and client together after installing both sets of dependencies:

```bash
bin/dev
```

The default ports are `3000` for Rails and `5173` for Vite. Override them with
`API_PORT`, `API_HOST`, `CLIENT_PORT`, and `CLIENT_HOST` as needed.

Open the client at [http://127.0.0.1:5173/](http://127.0.0.1:5173/).

The client connects to the API at `http://127.0.0.1:3000` by default. Set `VITE_API_URL` in `client/.env` to use another API URL.

## Tests

```bash
bundle exec rails test
```

## Documentation

- [Documentation index](docs/README.md)
- [Database model and ER diagram](docs/database.md)
- [API reference](docs/api.md)
- [Client guide](docs/client.md)
- [Development guide](docs/development.md)
