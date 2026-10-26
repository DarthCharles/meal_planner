# Rails and Ruby upgrade plan

Investigated October 25, 2026. Platform migration completed October 26, 2026.
See the implementation record below for completed checkpoints and verification.

## Objective

Upgrade the existing Rails API to the latest Rails 8.1 and Ruby 3.4 patch releases
before migrating API contracts and generating the React client's types and HTTP
functions. Preserve the existing API behavior during the platform upgrade.

Rails 8.1 receives security fixes through October 10, 2027. Ruby 3.4 is under
normal maintenance at the time of this investigation. Recheck support and patch
versions when executing the plan.

## Original state

- Rails 6.0.4.7, Ruby 3.0.0p0, Bundler 2.3.10.
- API-only application with framework defaults set to 6.0.
- Locked sqlite3 1.4.2, Puma 4.3.12, Spring 2.1.1, Bootsnap 1.11.1,
  and Rack 2.2.3. Gemfile restricts sqlite3 to `~> 1.4` and Puma to `~> 4.1`.
- Lockfile lists only the `x86_64-darwin-19` platform.
- Thirteen active Rails test declarations; many model/controller test files are
  placeholders. Existing GitHub Actions cover only the client.
- No deployment manifests or Dockerfile were found. Actual deployment runtime
  and production database use remain unknown.

## Migration stages

Each stage should be independently reviewable. Use the latest patch of each Rails
series, address deprecations, and review `app:update` output before adopting it.
Keep Ruby upgrades separate from Rails upgrades.

| Stage | Work | Verification gate |
| --- | --- | --- |
| 1. Baseline | Run current Rails tests. Add backend CI and missing API characterization tests. | Green backend baseline; existing defects recorded separately. |
| 2. Rails 6.0 to 6.1 | Patch 6.0 first, then upgrade to 6.1 on Ruby 3.0. Review configuration and framework defaults. Resolve or remove unused Spring dependencies. | Full Rails suite, Zeitwerk check, route comparison, application boot. |
| 3. Rails 7.0 to 7.1 | Upgrade one minor release at a time. Resolve deprecations and required configuration changes. | Repeat backend gates after each minor upgrade. |
| 4. Ruby bridge | On Rails 7.1, move to the latest Ruby 3.3 patch and compatible Bundler. Refresh native dependencies and supported lockfile platforms. | Full suite; macOS and Linux dependency installation. Compatibility must be proven during execution. |
| 5. Rails 7.2 to 8.1 | Upgrade through 7.2, 8.0, and 8.1. Resolve Rack/Puma dependencies and upgrade sqlite3 to a compatible 2.x release. | Backend gates at each minor version; isolated SQLite migration and seed checks. |
| 6. Ruby 3.4 | Upgrade Ruby separately after Rails 8.1 is stable. Update runtime pins, CI, setup docs, and AGENTS.md requirements. | Full suite, fresh setup, production-mode boot, development launcher smoke test. |
| 7. Generated API contracts | Start a separate migration of request/response contracts, OpenAPI generation, and generated React API code. | Separate design and implementation review. |

Framework defaults should advance deliberately at each Rails milestone, with
behavior changes verified before enabling them.

## Repository-specific risks

1. **SQLite:** Rails 8.1 requires sqlite3 >= 2.1, which the current Gemfile
   excludes. Test schema loading and migrations on disposable databases and an
   isolated copy of existing data. Do not edit old migrations or use the actual
   development database for verification.
2. **Spring:** Rails 7 requires Spring 3+ when used, while the locked
   spring-watcher-listen requires Spring < 3. `bin/rails` does not load Spring.
   Removing the unused pair is the simplest candidate, subject to checking the
   project's other launch paths.
3. **Exception handling:** At Rails 7.1, change test configuration
   `show_exceptions = false` to `:none` to preserve its semantics.
4. **Implicit requires:** MenuGenerationService uses `Set` without an explicit
   require. Verify clean-process loading and make standard-library dependencies
   explicit where needed.
5. **Sparse backend coverage:** Characterize meal/menu reads, meal types, units,
   meal writes, validation, and missing records before upgrading. Assert actual
   JSON shapes, status codes, decimal quantities, timestamps, nested ordering,
   and association behavior.
6. **Existing write/error behavior:** Characterize transaction boundaries and
   inconsistent error shapes. Handle intentional API changes separately from
   framework compatibility work.

## Verification

At each Rails or Ruby milestone, run `bundle exec rails test`,
`bin/rails zeitwerk:check`, and relevant boot/configuration checks. Use disposable
data for real HTTP reads/writes, CORS preflight, menu generation, schema loading,
migrations, and seeds. Confirm production boot with appropriate test credentials
and environment settings.

At completion, also run the client build and committed browser suite. Those
browser tests mock the API and cannot establish Rails integration correctness.
Inspect any actual deployment environment before prescribing deployment steps.

The original investigation checked files, installed runtimes, `ruby --version`,
`bundle --version`, `bundle check`, and Git status. At that point Ruby/Bundler
matched the original pins and `bundle check` passed; application behavior on
newer versions had not yet been tested.

## Implementation record

SQLite remains the database. API contracts and generated React types are a
separate follow-up; no endpoint or payload redesign is included here.

The original baseline passed 13 tests and 33 assertions. API characterization
coverage expanded this to 23 tests, covering response envelopes, decimal strings,
nullability, nested ordering, UTC timestamps, writes, reference data, validation,
missing reads, and CORS. A separate Rails GitHub Actions workflow now runs the
suite and Zeitwerk check, with eager loading enabled in CI.

| Rails | Ruby | Local checkpoint |
| --- | --- | --- |
| 6.0.6.1 | 3.0.0 | 23 tests, 94 assertions; Zeitwerk passed. |
| 6.1.7.10 | 3.0.0 | 23 tests, 94 assertions; Zeitwerk passed. |
| 7.0.10 | 3.0.0 | 23 tests, 94 assertions; Zeitwerk passed. |
| 7.1.6 | 3.0.0 | 23 tests, 96 assertions; Zeitwerk passed. |
| 7.1.6 | 3.3.13 | 23 tests, 96 assertions; Zeitwerk passed. |
| 7.2.4 | 3.3.13 | 23 tests, 96 assertions; Zeitwerk passed. |
| 8.0.5.1 | 3.3.13 | 23 tests, 96 assertions; Zeitwerk passed. |
| 8.1.4 | 3.3.13 | 23 tests, 96 assertions; Zeitwerk passed. |
| 8.1.4 | 3.4.12 | 23 tests, 96 assertions with CI eager loading; Zeitwerk passed. |

Native dependencies were refreshed for the newer Rubies, including Puma,
Bootsnap, nio4r, and the SQLite driver. An io-console constraint was needed only
for the Ruby 3.0 checkpoint and was removed at the Ruby 3.3 bridge. Spring and its
watcher were removed; launch scripts do not load them. Framework defaults were
advanced at each Rails milestone. Test exception handling now uses `:none`, and
environment files use `enable_reloading`.

The final lockfile uses Bundler 2.7.2, Puma 7.2.1, and sqlite3 2.10.1.
It includes Linux, Apple Silicon, and generic Ruby platforms as well as the
existing Intel macOS platforms. Resolution succeeded; Linux and Apple Silicon
installation/execution have not been tested locally.

Local setup installed Ruby 3.3.13 as the bridge and Ruby 3.4.12 as the final
runtime through RVM. Homebrew installed OpenSSL 3 and updated its CA certificate
dependency. The final Ruby was rebuilt against OpenSSL 3.5.9 instead of the
machine's existing OpenSSL 1.1 library.

All historical migrations successfully ran on a disposable SQLite database under
Rails 8.1, followed by seeds. The generated Rails 8.1 schema was also loaded into
a separate disposable database. No historical migrations were edited. Schema
dump changes express the new schema version and equivalent timestamp precision
defaults; they do not introduce a domain schema change.

A SQLite backup of the development database passed integrity and foreign-key
checks. Running migrations against that copy preserved the fingerprint of all
records (56 meals and 3 menus). The actual development database was not migrated.

The React production build and all 75 committed Chromium browser tests passed
across mobile, tablet, and desktop. These tests use mocked API responses.

Final verification also passed production-mode eager boot with a disposable
database and `SECRET_KEY_BASE_DUMMY=1`. The `bin/dev` launcher successfully started
Rails and Vite on temporary ports. Real HTTP checks passed meal reads and CRUD,
decimal quantities, validation and missing-record statuses, reference data,
seven-day menu generation, and CORS preflight. Vite returned HTTP 200. Temporary
servers were stopped afterward. All 16 application routes matched the baseline.

Commands used for the final gates (with the final RVM runtime selected):

```bash
CI=true bundle exec rails test
RAILS_ENV=test bundle exec rails zeitwerk:check
# DATABASE_URL and SCHEMA pointed into a disposable temporary directory:
RAILS_ENV=development bundle exec rails db:migrate db:seed
RAILS_ENV=test bundle exec rails db:schema:load
RAILS_ENV=production SECRET_KEY_BASE_DUMMY=1 bundle exec rails runner 'Rails.application.eager_load!'
cd client
npm run build
npm run test:browser
```

Stop any old development server, select `rvm use ruby-3.4.12`, run
`bundle install`, and restart `bin/dev` to use the migrated application.

Known existing issues remain outside this migration: day creation with meal IDs
returned association validation errors on the original Rails version, and meal
writes/menu replacement have incomplete transaction boundaries. API error shapes
remain inconsistent. Address these deliberately with the later API work.

These are local results; the new CI workflow has not been run remotely.

## Primary references

- [Rails maintenance policy](https://rubyonrails.org/maintenance)
- [Ruby maintenance branches](https://www.ruby-lang.org/en/downloads/branches/)
- [Rails upgrade guide](https://guides.rubyonrails.org/upgrading_ruby_on_rails.html)
- [Rails 8.1 SQLite adapter requirements](https://github.com/rails/rails/blob/v8.1.0/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb)
