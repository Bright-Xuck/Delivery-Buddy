import sql from '../src/db/connection.js';
import app from '../src/app.js';
import request from 'supertest';
import chai from 'chai';

chai.should();
export const expect = chai.expect;
export { chai };

// Create a fresh courier directly in the DB for tests that need a known state.
export async function createCourier(overrides = {}) {
  const id = overrides.id || crypto.randomUUID();
  const email = overrides.email || `test-${crypto.randomUUID()}@example.com`;
  const name = overrides.name || 'Test Courier';
  const passwordHash =
    overrides.passwordHash || '$2b$10$xf5fh/wDmVpz8msTCVrzNOiMAnZrt/ZeOVRQE0YBmBt49ofwFrkDu';
  const workId = overrides.work_id || id;

  await sql`
    INSERT INTO couriers (id, work_id, name, email, password_hash, team, rate, level)
    VALUES (${id}, ${workId}, ${name}, ${email}, ${passwordHash}, 'Downtown', 25, 3)
    ON CONFLICT (id) DO NOTHING
  `;

  return { id, email, name };
}

export async function deleteCourier(courierId) {
  await sql`DELETE FROM couriers WHERE id = ${courierId}`;
}

// Register + login a courier through the API, returning the full signup body
// (which includes the token and courier.id). If a courier with that email
// already exists (e.g. created via createCourier), it is deleted first so the
// signup always succeeds and returns a valid token.
export async function signupAndLogin(email, password = 'password123', name = 'Tester') {
  const existing = await sql`SELECT id FROM couriers WHERE email = ${email}`;
  if (existing.length) {
    await sql`DELETE FROM couriers WHERE id = ${existing[0].id}`;
  }

  const res = await request(app)
    .post('/api/auth/signup')
    .send({ email, password, name });

  return res.body;
}

export { app, request };

// Truncate all tables so each test file starts clean (only if using a dedicated test DB).
export async function resetTestDb() {
  await sql`
    TRUNCATE couriers, shifts, orders, order_items, transactions, messages
    RESTART IDENTITY CASCADE
  `;
}