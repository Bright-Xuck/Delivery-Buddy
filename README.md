# Delivery Buddy — Backend

This is the API that powers the Delivery Buddy courier app. It's a small Express
service backed by PostgreSQL. The endpoint contract lives in
[`docs/requirements.md`](docs/requirements.md) and the data model is in
[`docs/erd.md`](docs/erd.md).

## Base URLs

| Environment | Base URL                                | Swagger UI                                  |
|-------------|-----------------------------------------|---------------------------------------------|
| Local       | `http://localhost:3000/api`             | `http://localhost:3000/api-docs`            |
| Live        | `https://delivery-buddy.onrender.com/api` | `https://delivery-buddy.onrender.com/api-docs` |

Every route except the ones under `/auth` needs a Bearer JWT in the
`Authorization` header.

## Stack

- Node.js (ESM) + Express 4
- PostgreSQL, accessed with the `postgres` driver using raw SQL
- Auth via `jsonwebtoken` + `bcrypt`
- Swagger docs via `swagger-jsdoc` + `swagger-ui-express`
- `node-cache` for a short-lived read cache on wallet/profile
- Tests: Mocha + Chai + Supertest

## Layout

```
backend/
  src/
    app.js              # app + swagger UI, mounts routes under /api
    index.js            # starts the server
    cache.js            # the node-cache instance
    db/
      connection.js     # postgres client (reads DATABASE_URL)
      init.sql          # schema
      seed.sql          # demo data
      run-init.js       # used by `npm run db:init`
      run-seed.js       # used by `npm run db:seed`
    middleware/
      requireAuth.js    # JWT check
      errorHandler.js   # turns thrown errors into JSON
    routes/
      auth.js courier.js shifts.js orders.js wallet.js
  test/                 # mocha tests
docs/
  requirements.md       # what each endpoint does
  erd.md                # table diagram
```

## Requirements

- Node 18 or newer
- A Postgres database (local or hosted — I used Neon)

## Getting started

```bash
cd backend
npm install
cp .env.example .env      # then open .env and set DATABASE_URL + JWT_SECRET
```

Environment variables:

| Variable       | Needed | Notes                                                 |
|----------------|--------|-------------------------------------------------------|
| `PORT`         | no     | Defaults to 3000                                      |
| `JWT_SECRET`   | yes    | Any long random string; used to sign tokens          |
| `DATABASE_URL` | yes    | Full Postgres URL. If absent, the `DB_*` vars below are used instead |
| `DB_USER`      | no*    |                                                       |
| `DB_PASSWORD`  | no*    |                                                       |
| `DB_HOST`      | no*    |                                                       |
| `DB_PORT`      | no*    |                                                       |
| `DB_NAME`      | no*    |                                                       |
| `DATABASE_SSL` | no     | Set to `true` for hosted databases that require SSL  |
| `TEST_DATABASE_URL` | no | A separate DB for tests; falls back to `DATABASE_URL` |

\* Only used when `DATABASE_URL` isn't set.

## Database setup

```bash
npm run db:init     # create tables
npm run db:seed     # optional: a demo courier + shift + order
```

After seeding you can log in with `tyler@example.com` / `test1234`.

## Running

```bash
npm run dev     # nodemon
npm start       # plain node
```

Swagger UI is at `http://localhost:3000/api-docs`.

## Tests

```bash
cd backend
npm test
```

Four files under `test/` cover auth, shifts, orders and wallet: validation,
duplicate emails, wrong passwords, the "only one active shift" rule,
order status transitions (including the EARNING/TIP rows created on delivery),
withdrawal limits and the auth guard. Each test signs up its own courier and
deletes it afterwards, so it's safe to point at a dev database.

## Caching

`GET /wallet` and `GET /courier/me` are cached in memory for 60 seconds
(see `src/cache.js`). Any write that touches a courier — profile/settings
edits, a withdrawal, or an order being marked delivered — drops that
courier's cache entry so the next read is fresh. It's deliberately simple;
if this ever moves to multiple instances, swap `node-cache` for Redis.

## Deploying (Render)

This is already live at `https://delivery-buddy.onrender.com`, but for
reference (or to redeploy after changes):

1. New **Web Service** in Render, point it at this repo, root directory `backend`.
2. Build: `npm install` — Start: `npm start`.
3. Add `DATABASE_URL`, `JWT_SECRET`, `PORT`, and `DATABASE_SSL=true` as
   environment variables.
4. Once the service is up, run `npm run db:init` once (Render shell or a
   one-off job) to create the tables.
5. Push to `main` and Render redeploys automatically if you linked the repo,
   otherwise hit **Manual Deploy**.

Live endpoints:
`https://delivery-buddy.onrender.com/api` and
`https://delivery-buddy.onrender.com/api-docs`.