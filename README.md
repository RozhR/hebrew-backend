# Hebrew Learning Backend

**REST API for [Hebrew Learning](https://hebrewlearning.co.il/)** — a full-stack Hebrew vocabulary and grammar learning platform.

[Live website](https://hebrewlearning.co.il/) · [Frontend repository](https://github.com/RozhR/hebrew-redux-toolkit) · [Backend v1.0.0](https://github.com/RozhR/hebrew-backend/tree/v1.0.0)

The API delivers learning content, handles authentication and user-specific progress, and provides access-controlled administrative analytics.

## Stack and responsibilities

Node.js, Express, PostgreSQL and `pg`; bcrypt password hashing and JWT authentication in an HttpOnly cookie. Jest and Supertest cover API behavior and integration with a separate test database.

The API serves vocabulary and grammar, stores personal statistics, unlocks levels, manages selected grammar words and exposes administrator-only analytics endpoints.

Content is maintained in Excel, converted to JSON seed data and imported into PostgreSQL. The `content` schema contains learning material; the `app` schema contains users and their data.

## Requirements

- Node.js 24 and npm 11, matching the verified installation environment.
- A running PostgreSQL server and a database user allowed to create the application schemas.
- Two separate databases for development and integration tests.

The primary development/documentation branch is `main`; the production service uses `deploy`. The `v1.0.0` tag identifies the first public release.

## Local setup

```powershell
git clone https://github.com/RozhR/hebrew-backend.git
cd hebrew-backend
npm ci
Copy-Item .env.example .env
```

Edit `.env`: set PostgreSQL credentials and replace `JWT_SECRET` with a long random secret. Generate a value locally with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Keep `.env` and `.env.test` out of Git. The example values are placeholders.

Create `hebrew_learning` in pgAdmin or with your PostgreSQL administration tool. Then initialize the new database:

```powershell
npm run db:schema
npm run seed:vocabulary
npm run seed:verb-grammar
npm run seed:adjective-grammar
npm run seed:adverb-grammar
npm run dev
```

Existing JSON seed files are included, so Excel conversion is not required for the first launch. Wait for both the PostgreSQL connection message and the server startup message. Check <http://localhost:3000/api/health>, then start the frontend in a separate terminal.

For an existing working database, normal startup only requires `npm run dev`.

## Tests

Create a separate, empty database named `hebrew_learning_test`. Do not seed it with the learning content: statistics integration tests insert their own vocabulary fixtures.

Copy `.env.example` to `.env.test`, set its database credentials and change:

```dotenv
DB_NAME=hebrew_learning_test
NODE_ENV=test
JWT_SECRET=replace_with_a_separate_random_test_secret
```

Initialize the test schema explicitly using `.env.test`:

```powershell
node --input-type=module -e "import dotenv from 'dotenv'; dotenv.config({path: '.env.test', override: true}); await import('./scripts/createSchema.js');"
npm test
```

Test setup rejects any database name other than `hebrew_learning_test`. Integration tests create and remove their own users and vocabulary fixtures. They must run against the separate test database.

Jest currently uses Node's `--experimental-vm-modules` flag. Its experimental warning is expected; it does not indicate a failed test.

## Checks

```powershell
npm run lint
npm run format:check
npm test
```

Use `npm ci` for a clean installation from the committed lock file. Use `npm install` when intentionally changing dependencies, and commit the updated lock file with `package.json`.

## API

Protected endpoints use the authentication cookie set by login.

| Method            | Path                                                                    | Purpose                                                    | Authentication |
| ----------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------- | -------------- |
| GET               | `/api/health`                                                           | API status; not a live database readiness probe            | Public         |
| POST              | `/api/auth/register`                                                    | Create an account                                          | Public         |
| POST              | `/api/auth/login`                                                       | Set the authentication cookie                              | Public         |
| POST              | `/api/auth/logout`                                                      | Clear the cookie                                           | Public         |
| GET               | `/api/users/me`                                                         | Current user                                               | Required       |
| GET               | `/api/verbs`, `/api/adjectives`, `/api/adverbs`                         | Vocabulary; optional `level` query                         | Public         |
| GET               | `/api/verbs/:id`, `/api/adjectives/:id`, `/api/adverbs/:id`             | One vocabulary item                                        | Public         |
| GET               | `/api/grammar/verbs`, `/api/grammar/adjectives`, `/api/grammar/adverbs` | Grammar for comma-separated `ids`, at most 100 per request | Public         |
| GET               | `/api/progress`                                                         | Unlocked levels                                            | Required       |
| GET, POST, DELETE | `/api/statistics`                                                       | Vocabulary test statistics                                 | Required       |
| GET, POST, DELETE | `/api/statistics/grammar`                                               | Grammar test statistics                                    | Required       |
| GET, POST, DELETE | `/api/grammar-words`                                                    | Selected grammar words                                     | Required       |
| DELETE            | `/api/grammar-words/:category/:id`                                      | Remove one selected word                                   | Required       |

Successful data responses use `{ data: ... }`; errors use `{ message: ... }`.

## Administrator analytics

The application includes an administrator role and protected analytics endpoints used by the frontend administration dashboard. Regular accounts must not have access to administrative data. Authorization is enforced server-side, not only by hiding frontend navigation. Administrator API behavior is covered by integration tests.

## Excel dependency

SheetJS `xlsx` is pinned to 0.20.3 from the official SheetJS CDN, following its [Node.js installation instructions](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/). The npm registry release 0.18.5 is outdated. `npm ci` installs the pinned archive and verifies its integrity from `package-lock.json`.

## Content maintenance

After editing Excel source files in `content/grammar`, run `npm run grammar:build` to regenerate JSON, then run the seed commands to synchronize the database. Seeds upsert rows; they do not remove rows absent from the source.

`npm run content:reset` deletes and reloads content. It is restricted to a local development database and requires typing `RESET CONTENT`. It leaves the `app` schema intact. The complete reset is not atomic across all seed scripts; use it for local maintenance.

`database/schema.sql` initializes tables with `CREATE TABLE IF NOT EXISTS`; it is not a versioned migration system.

## Production and current limits

The production Node.js service is deployed on Render from the `deploy` branch, using `npm ci --omit=dev` and `node src/server.js`, with `/api/health` configured as its health-check path. The public frontend is at https://hebrewlearning.co.il/.

Production must use HTTPS and `NODE_ENV=production` so the authentication cookie is secure. Configure the allowed frontend origin and cookie behavior according to the actual deployment. Vite proxies `/api` in local development. Use `npm start` to run without file watching.

The server recomputes percentages and validates vocabulary totals and unlocked levels. It still trusts the submitted correct-answer count. Rate limiting for login and registration, deployment automation and versioned database migrations remain future work.

## Local Docker setup

Requires Docker Desktop running Linux containers.

Keep both repositories in sibling directories:

- hebrew-backend
- hebrew-redux-toolkit

Run the following commands from hebrew-backend.

### Environment

Create .env.docker with two different randomly generated values:

```dotenv
DOCKER_DB_PASSWORD=your_random_password
DOCKER_JWT_SECRET=your_random_secret
```

Generate each value separately:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

The .env.docker file is ignored by Git.

### First launch

Build the backend image and start PostgreSQL:

```powershell
docker compose --env-file .env.docker build backend
docker compose --env-file .env.docker up -d db
```

Create the schema and import content. Run commands one at a time and stop if any command fails:

```powershell
docker compose --env-file .env.docker run --rm backend npm run db:schema
docker compose --env-file .env.docker run --rm backend npm run seed:vocabulary
docker compose --env-file .env.docker run --rm backend npm run seed:verb-grammar
docker compose --env-file .env.docker run --rm backend npm run seed:adjective-grammar
docker compose --env-file .env.docker run --rm backend npm run seed:adverb-grammar
```

Build and start the application:

```powershell
docker compose --env-file .env.docker up --build -d
```

Open http://localhost:8080.

This setup uses a separate Docker database. Existing accounts in local PostgreSQL are not copied. Register a new account in the Docker instance.

### Daily use

Start:

```powershell
docker compose --env-file .env.docker up -d
```

Check status and logs:

```powershell
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs backend frontend
```

Stop while keeping database data:

```powershell
docker compose --env-file .env.docker down
```

Database data is stored in the postgres-data volume. Using down -v deletes that volume and its data.

After changing application code, rebuild:

```powershell
docker compose --env-file .env.docker up --build -d
```

Schema creation and content import are manual setup steps, not automatic startup steps. Grammar seed commands replace their corresponding content tables.

This configuration is intended for local HTTP use. Public deployment requires HTTPS and production authentication cookie settings.

## Release

**v1.0.0 — 12 October 2026.** Initial public backend release, including vocabulary/grammar APIs, PostgreSQL persistence, user authentication, saved progress and administrator analytics.

At the v1.0.0 checkpoint, **28 backend tests in 4 Jest suites passed**, and the production-only dependency audit reported **0 known vulnerabilities**. These results are a release snapshot, not a guarantee against future vulnerabilities.
