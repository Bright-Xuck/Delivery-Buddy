# Delivery Buddy — Backend

A RESTful API for the **Delivery Buddy** courier mobile app. Built with Node.js, Express, and PostgreSQL (raw SQL via `postgres`).

> Frontend data requirements are fully served by the endpoints below. See [`docs/requirements.md`](docs/requirements.md) for the full endpoint contract and [`docs/erd.md`](docs/erd.md) for the entity-relationship diagram.

## Base URLs

| Environment | Base URL                      | Swagger UI                          |
|-------------|-------------------------------|-------------------------------------|
| Local       | `http://localhost:3000/api`   | `http://localhost:3000/api-docs`    |
| Deployed    | `https://<your-deployed-host>/api` | `https://<your-deployed-host>/api-docs` |

All routes (except `/auth/*`) require a **Bearer JWT** in the `Authorization` header.

## Tech stack

- **Runtime:** Node.js (ESM, `"type": "module"`)
- **Framework:** Express 4
- **Database:** PostgreSQL (accessed with the `postgres` client, raw SQL)
- **Auth:** JWT (`jsonwebtoken`) + `bcrypt` password hashing
- **Docs:** Swagger / OpenAPI 3 (`swagger-jsdoc` + `swagger-ui-express`)
- **Caching:** `node-cache` (60s TTL on wallet + profile reads)
- **Tests:** Mocha + Chai + Supertest

## Project layout

```
backend/
  src/
    app.js              # Express app + Swagger UI + /api mount
    index.js            # Entry point (listens on PORT)
    cache.js            # node-cache instance + key helpers
    db/
      connection.js     # postgres client (reads DATABASE_URL)
      init.sql          # schema (CREATE TABLE IF NOT EXISTS)
      seed.sql          # dev seed data
      run-init.js       # npm run db:init
      run-seed.js       # npm run db:seed
    middleware/
      requireAuth.js    # JWT guard
      errorHandler.js   # centralized error shape
    routes/
      auth.js courier.js shifts.js orders.js wallet.js
  test/                 # mocha test suite
docs/
  requirements.md       # endpoint contract
  erd.md                # ER diagram
```

## Prerequisites

- Node.js 18+
- A PostgreSQL database (local install, or a hosted provider such as Neon, Render, Railway, Supabase)

## Setup

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Configure environment
cp .env.example .env
#   then edit .env and set DATABASE_URL (and JWT_SECRET)
```

### Environment variables

| Variable       | Required | Description                                                        |
|----------------|----------|--------------------------------------------------------------------|
| `PORT`         | no       | HTTP port (default `3000`)                                         |
| `JWT_SECRET`   | yes      | Secret used to sign courier tokens. Use a long random string.      |
| `DATABASE_URL` | yes      | Postgres connection string. Takes precedence over the vars below.  |
| `DB_USER`      | no*      | Used only if `DATABASE_URL` is absent.                             |
| `DB_PASSWORD`  | no*      |                                                                    |
| `DB_HOST`      | no*      |                                                                    |
| `DB_PORT`      | no*      |                                                                    |
| `DB_NAME`      | no*      |                                                                    |
| `DATABASE_SSL` | no       | Set `"true"` for hosted DBs that require SSL.                       |
| `TEST_DATABASE_URL` | no  | Dedicated DB for the test suite. Falls back to `DATABASE_URL`.     |

\* Only needed when `DATABASE_URL` is not provided.

## Database

```bash
# Create tables
npm run db:init

# (Optional) insert seed data — a demo courier + shift + order + messages
npm run db:seed
```

Seed demo login: `tyler@example.com` / `test1234`.

## Run

```bash
npm run dev     # nodemon, auto-restart on change
# or
npm start       # plain node
```

Open `http://localhost:3000/api-docs` for the interactive Swagger UI.

## Test

```bash
cd backend
npm test
```

The suite (`test/auth.test.js`, `test/shifts.test.js`, `test/orders.test.js`, `test/wallet.test.js`)
covers signup/login validation, duplicate-email, wrong-password, shift rules
(no two active shifts, stop-with-none → 404), order status transitions (invalid → 400,
valid → creates EARNING/TIP transactions), wallet withdrawal limits, and the auth guard.

Tests talk to `TEST_DATABASE_URL` if set, otherwise `DATABASE_URL`. Each test creates and
cleans up its own courier, so it is safe to run against a development database.

## Caching strategy

`GET /wallet` and `GET /courier/me` are cached in memory for **60 seconds** (`src/cache.js`,
`node-cache`). Any mutating route touching that courier (`PATCH /courier/me`,
`PATCH /courier/me/profile`, `PATCH /courier/settings`, `POST /wallet/withdraw`, and the
order → `DELIVERED` transition) invalidates the relevant cache entry so reads stay consistent.

## Deployment

The API is a stateless Node service — deploy it to any platform that runs Node (Render,
Railway, Fly.io, Heroku, a VM, etc.).

Example — **Render**:

1. Create a new **Web Service**, link this repo, set the root directory to `backend`.
2. Build command: `npm install`
3. Start command: `npm start`
4. Add the environment variables above (`DATABASE_URL`, `JWT_SECRET`, `PORT`, `DATABASE_SSL=true`).
5. Use the same Postgres instance for `DATABASE_URL`, then run `npm run db:init` once
   (e.g. via Render's shell or a one-off job) to create the schema.
6. Once live, your base URL is `https://<your-render-url>/api`. Update it in this README
   and in `docs/requirements.md`.

Example — **Railway**:

1. `railway init` and `railway up` from the `backend` directory (or link via the dashboard).
2. Add a Postgres plugin; copy its `DATABASE_URL` into the service variables.
3. Run `npm run db:init` through `railway run`.
4. Your live URL becomes `https://<your-railway-url>/api`.

> ⚠️ After deployment, replace `<your-deployed-host>` above and in `docs/requirements.md`
> with the real host so evaluators can reach the live API and Swagger docs.

## Deliverables

- [x] Requirements spec — `docs/requirements.md`
- [x] ERD / schema diagram — `docs/erd.md`
- [x] RESTful API (auth, courier, shifts, orders + chat, wallet)
- [x] Swagger / OpenAPI docs at `/api-docs`
- [x] PostgreSQL data layer + seed
- [x] In-memory caching (wallet + profile)
- [x] Automated test suite (21 tests)
- [x] This README (setup / run / test / deploy)