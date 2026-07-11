# Delivery Buddy Backend — 2-Day Implementation Plan

Reference doc for Copilot/Cline. Product: courier-facing delivery app ("Delivery Buddy").
Screens confirmed from mockups: onboarding (2 screens) → profile setup (Step 2 form) →
dashboard idle → dashboard active shift → wallet/transactions → profile/settings →
order detail → active delivery map → in-app chat.

Stack: Node.js + Express + SQLite via **Knex** (raw SQL + migrations, no ORM/Mongo-style
ODM) + Redis or in-memory cache + **Mocha + Chai + Supertest** + Swagger
(swagger-jsdoc + swagger-ui-express, generated from route comments) + **REST Client**
`.http` files for day-to-day manual testing (kept alongside Swagger, not replaced by it).

---

## DAY 1 — Foundation, Schema, Auth, Core Domain

### Step 1: Project scaffold (30 min)
- `npm init`, install: express, knex, sqlite3, dotenv, cors, helmet, jsonwebtoken,
  bcrypt, express-validator (or a lightweight manual validator — see note below),
  swagger-jsdoc, swagger-ui-express, mocha, chai, chai-http (or keep supertest, both
  work fine with Mocha), nodemon.
- Folder structure:
  ```
  src/
    routes/
    controllers/
    services/
    middleware/
    validators/       (plain functions or express-validator chains)
    db/
      knexfile.js
      migrations/
      seeds/
  requests/
    auth.http          (REST Client files — your manual test suite)
    shifts.http
    orders.http
    wallet.http
    chat.http
  test/                (Mocha convention: lowercase "test" not "tests")
  docs/
    requirements-spec.md
    erd.md
  ```
- `.env` with `DATABASE_FILE`, `JWT_SECRET`, `PORT`.

**Validation note:** since you don't know zod, use **express-validator** — it's
middleware-style, so it plugs straight into Express routes the way you already think
(`body('email').isEmail()`, then a check-results middleware). Simpler learning curve
than a schema-builder library.

**Copilot prompt:** *"Scaffold an Express project with Knex (SQLite), express-validator,
JWT auth middleware, and a routes/controllers/services/db folder structure. Add
nodemon dev script and a knexfile.js with migration/seed directories."*

### Step 2: Data model / ERD (from mockups) — 45 min
Write a Knex migration (`db/migrations/001_init.js`) with `CREATE TABLE`-equivalent
schema builders for these tables (matches every field visible in the UI). Since
you're SQL-fluent, think of this as writing SQL DDL through Knex's schema builder —
each `.createTable()` call maps 1:1 to a `CREATE TABLE` statement:

- **couriers**: id, work_id, name, email, password_hash, avatar_url, team,
  rate (float, %), level (int), transportation (text: BICYCLE/CAR/TRUCK),
  vehicle_number, created_at
- **shifts**: id, courier_id (FK), started_at, ended_at (nullable),
  status (ACTIVE/ENDED), earnings (float), tips (float), deliveries_completed (int)
- **orders**: id, order_number (e.g. "#403-540"), courier_id (FK, nullable),
  shift_id (FK, nullable), status (PENDING/DELIVERING/AT_DOOR/DELIVERED),
  pickup_name, pickup_address, destination_name, destination_address,
  customer_name, customer_phone, total (float), payment_method (CARD/CASH),
  courier_earn (float), tip (float), eta_time, distance_left_km (float), created_at
- **order_items**: id, order_id (FK), name, price, note
- **transactions**: id, courier_id (FK), order_id (FK, nullable),
  type (EARNING/TIP/WITHDRAWAL), amount, created_at
- **messages**: id, order_id (FK), sender_type (COURIER/CUSTOMER), text, seen (bool),
  created_at

Generate an ERD diagram (Mermaid, so it renders on GitHub):

**Copilot prompt:** *"Write a Knex migration file creating these tables with
appropriate foreign keys and indexes on courier_id/order_id columns: [paste table
list above]. Use Knex's schema builder, not raw SQL strings, so it stays portable."*

Run `npx knex migrate:latest`. Write a matching `seeds/001_dev_data.js` so you have
sample data to hit endpoints against immediately (query it directly with the
`sqlite3` CLI or a GUI like DB Browser for SQLite, using plain SQL you already know).

### Step 3: Auth (1 hr)
Endpoints:
- `POST /auth/signup` — email, password, name → hash password, create Courier, return JWT
- `POST /auth/login` — return JWT
- `POST /auth/logout` — client-side token discard (stateless JWT) or token blacklist if time allows
- Middleware `requireAuth` — verifies JWT, attaches `req.courierId`

**Copilot prompt:** *"Implement JWT-based auth for Express with bcrypt password
hashing, express-validator DTOs for signup/login, and a requireAuth middleware that
reads Bearer token and attaches courierId to req."*

### Step 4: Courier profile (maps to "Step 2: Please fill in your personal info") — 45 min
- `PATCH /courier/me/profile` — body: workId, name, team, transportation, vehicleNumber
  (this is literally the onboarding form fields — validate transportation is one of the
  3 enum values shown as icons: bicycle/car/truck)
- `GET /courier/me` — returns full profile incl. level, rate (used by dashboard header
  and settings screen)
- `PATCH /courier/me` — edit profile (settings screen pencil icon: name, avatar)

**Copilot prompt:** *"Add courier profile endpoints using the requireAuth middleware.
PATCH /courier/me/profile validates workId (string), name, team, transportation
(enum BICYCLE|CAR|TRUCK), vehicleNumber with express-validator."*

### Step 5: Shift endpoints (maps to dashboard idle/active) — 1 hr
- `POST /shifts/start` — creates Shift(status=ACTIVE, startedAt=now) for courier;
  reject if one is already active
- `POST /shifts/stop` — sets endedAt=now, status=ENDED, finalizes earnings/tips/deliveriesCompleted
- `GET /shifts/current` — returns active shift or null → drives whether dashboard shows
  "Start shift" (empty state) or the active-shift view (earnings, deliveries completed,
  currently-delivering card)
- `GET /shifts/last` — most recent ended shift → powers "My last shift" card
  (date, start/end time, earned, tips)

**Copilot prompt:** *"Implement shift start/stop/current/last endpoints. Only one
ACTIVE shift per courier allowed — return 409 if start is called while one exists."*

**End of Day 1 checkpoint:** auth, profile setup, shift lifecycle all working and
manually testable via curl/Postman/Swagger UI.

---

## DAY 2 — Orders, Wallet, Chat, Caching, Tests, Docs, Deploy

### Step 6: Order + delivery endpoints (dashboard "currently delivering", map screen, order detail) — 1.5 hr
- `GET /orders/current` — the active order tied to courier's active shift; includes
  etaTime, distanceLeftKm (map screen), progress data
- `GET /orders/next` — "Next in the list" preview card
- `GET /orders/:id` — full detail: pickup/destination, itemized OrderInfo, total,
  paymentMethod, courierEarn, tip (order detail screen)
- `PATCH /orders/:id/status` — body `{status}`; enforce valid transitions
  (PENDING → DELIVERING → AT_DOOR → DELIVERED); "At the door" button maps to
  AT_DOOR; on DELIVERED, increment shift.deliveriesCompleted and create
  EARNING + TIP Transactions automatically

**Copilot prompt:** *"Add order endpoints. PATCH /orders/:id/status must validate
state transitions with a state machine (PENDING→DELIVERING→AT_DOOR→DELIVERED) and
reject invalid jumps with 400. On transition to DELIVERED, create Transaction rows
for courierEarn and tip in the same DB transaction."*

### Step 7: Wallet + transactions (wallet/analytics tab) — 45 min
- `GET /wallet` — aggregate: balance (sum of EARNING+TIP-WITHDRAWAL), tips total, rate,
  level — matches "$487.67 / $276.78 / +25% / Level 3" header
- `GET /wallet/transactions` — paginated list, each row: orderNumber, date, amount, tip
  (or negative amount for withdrawals) — matches transaction list exactly
- `POST /wallet/withdraw` — body `{amount}`; validate amount ≤ balance; create
  WITHDRAWAL transaction (negative)

**Copilot prompt:** *"Implement GET /wallet as an aggregation query over Transaction
rows grouped by courierId, and POST /wallet/withdraw with a balance check before
inserting a negative WITHDRAWAL transaction."*

### Step 8: Chat (in-app messaging screen) — 45 min
- `GET /orders/:id/messages` — ordered by createdAt
- `POST /orders/:id/messages` — body `{text}`, senderType=COURIER; mark customer
  messages `seen=true` on fetch
- (Optional if time allows) WebSocket/Socket.io for live updates — otherwise polling
  is fine for assessment scope, note this tradeoff in README

**Copilot prompt:** *"Add message endpoints for an order thread. Keep it REST +
polling for now; add a comment noting Socket.io would be the production upgrade."*

### Step 9: Caching layer (Task 3 requirement) — 30 min
- Use in-memory (node-cache) or Redis for: `GET /wallet` (recompute is cheap here but
  demonstrate the pattern), and any "coin list"/reference/static data equivalent —
  here that's courier settings/reference data (team list, transportation options).
- Cache with 60s TTL, invalidate on writes (withdraw, status change).

**Copilot prompt:** *"Add a simple caching middleware using node-cache with a 60s TTL
for GET /wallet and GET /courier/me, and invalidate the relevant keys inside the
withdraw and profile-update handlers."*

### Step 10: Settings endpoints (profile screen menu items) — 20 min
- `GET/PATCH /courier/settings` — billingMethod, location, notificationsEnabled
  (Fuel Management, Support can be static/read-only stub endpoints — note as
  out-of-scope stub in the requirements spec if time-constrained)

### Step 11: Manual testing with REST Client (ongoing, do this as you build each step) — 0 extra time if done inline
Since this is your existing workflow, keep a `.http` file per resource group
(`requests/auth.http`, `requests/shifts.http`, etc.) and add a request the moment
you finish an endpoint — don't batch this at the end. Use `.http` variables for the
JWT so you're not copy-pasting tokens:
```http
### Login
# @name login
POST http://localhost:3000/auth/login
Content-Type: application/json

{ "email": "tyler@example.com", "password": "test1234" }

### Start shift (uses token from login response)
POST http://localhost:3000/shifts/start
Authorization: Bearer {{login.response.body.token}}
```
Commit the `requests/` folder to the repo — evaluators can open it directly in
VS Code with REST Client installed, which doubles as informal API documentation.

### Step 12: Automated tests with Mocha + Chai + Supertest (Task 4) — 1.5 hr
Cover per requirements spec:
- Auth: signup/login validation errors, duplicate email, wrong password
- Shift: can't start two active shifts, stop with no active shift → 404
- Orders: invalid status transition rejected, valid transition creates transactions
- Wallet: withdraw more than balance → 400
- Each endpoint: one happy-path + one validation-error + one auth-required test

Structure: `test/auth.test.js`, `test/shifts.test.js`, etc. — Mocha auto-discovers
`test/**/*.test.js` by default, add `"test": "mocha --timeout 10000"` to package.json.
Use `supertest` for HTTP assertions inside Mocha's `describe`/`it` blocks (Chai just
gives you `expect(...)` assertion style on top — Supertest works with either Mocha
or Jest runners, so no need to relearn the HTTP-testing part, only the runner syntax
changes from `test()`/`expect()` to `describe()`/`it()`/`expect()`).

**Copilot prompt:** *"Write Mocha + Chai + Supertest tests for all endpoints listed
in docs/requirements-spec.md. Use describe/it blocks, an isolated test SQLite file
(set via a TEST_DATABASE_FILE env var), and a beforeEach hook that re-runs Knex
migrations + truncates tables between tests."*

### Step 13: Swagger/OpenAPI docs (Task 2 + deliverables) — 30–40 min
You haven't used Swagger before — here's the minimal path:
1. `swagger-jsdoc` reads specially-formatted comments above your route definitions
   and turns them into an OpenAPI spec. You already wrote the content for these in
   `requirements-spec.md` — it's mostly a copy/reformat job, not new writing.
2. Example comment block (goes directly above the route in your router file):
   ```js
   /**
    * @openapi
    * /shifts/start:
    *   post:
    *     summary: Start a new active shift
    *     security:
    *       - bearerAuth: []
    *     responses:
    *       201:
    *         description: Shift created
    *       409:
    *         description: A shift is already active
    */
   router.post('/shifts/start', requireAuth, startShift);
   ```
3. Mount once in your app entrypoint: `swagger-ui-express` serves the generated
   spec at `/api-docs` — that's it, no separate spec-writing tool needed.

**Copilot prompt:** *"Generate swagger-jsdoc @openapi comment blocks for every route
file based on docs/requirements-spec.md, and mount swagger-ui-express at /api-docs
in the main app file."*

### Step 14: Requirements spec doc (Task 1 deliverable) — already done ✅
This is `docs/requirements-spec.md` — you already have it. Just keep it in sync if
any endpoint shape changes while building.

### Step 15: Deploy (Task 5) — 30–45 min
- Railway or Render (both handle SQLite via volume, or swap to Postgres if the
  platform doesn't persist disk — Railway/Render free tier: use their Postgres
  add-on instead of SQLite for the deployed version).
- Set env vars in platform dashboard, not in repo.
- Confirm `/api-docs` and one live endpoint work post-deploy; put base URL in README.

### Step 16: README + final polish (30 min)
- Setup / run / test / deploy sections, ERD image/mermaid embed, link to
  requirements-spec.md, Swagger URL, live API URL, list of stub/out-of-scope items
  (Socket.io chat, Fuel Management) so evaluators know what's intentionally scoped out.

---

## Cut-scope-safely list (if you run short on time)
Cut in this order, latest first: WebSocket chat upgrade → Fuel Management/Support
stubs → withdraw endpoint edge-case tests → Redis (fall back to in-memory cache,
mention Redis as the production choice in README).

Do NOT cut: auth, shift lifecycle, order status transitions, wallet aggregation,
Swagger docs, at least core happy-path tests, deployment — these are what's directly
graded per the deliverables list.