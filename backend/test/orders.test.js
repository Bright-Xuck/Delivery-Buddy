import { app, request, signupAndLogin, deleteCourier, expect } from './helpers.js';
import sql from '../src/db/connection.js';

describe('Orders', () => {
  let token;
  let courierId;
  let shiftId;
  let orderId;

  beforeEach(async () => {
    const email = `order-${crypto.randomUUID()}@example.com`;
    const body = await signupAndLogin(email);
    courierId = body.courier.id;
    token = body.token;

    shiftId = crypto.randomUUID();
    await sql`
      INSERT INTO shifts (id, courier_id, started_at, status)
      VALUES (${shiftId}, ${courierId}, NOW(), 'ACTIVE')
    `;

    orderId = crypto.randomUUID();
    await sql`
      INSERT INTO orders (id, order_number, courier_id, shift_id, status, pickup_name,
        pickup_address, destination_name, destination_address, customer_phone,
        total, payment_method, courier_earn, tip, eta_time, distance_left_km)
      VALUES (${orderId}, '#999-001', ${courierId}, ${shiftId}, 'PENDING',
        'Pizza', 'addr1', 'Cust', 'addr2', '123', 50, 'CARD', 50, 10, NOW(), 2)
    `;
  });

  afterEach(async () => {
    await sql`DELETE FROM orders WHERE id = ${orderId}`;
    await sql`DELETE FROM shifts WHERE id = ${shiftId}`;
    if (courierId) await deleteCourier(courierId);
  });

  it('rejects invalid status transition (400)', async () => {
    const res = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'DELIVERED' });
    expect(res.status).to.equal(400);
  });

  it('advances PENDING -> DELIVERING (200)', async () => {
    const res = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'DELIVERING' });
    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal('DELIVERING');
  });

  it('creates EARNING and TIP transactions on DELIVERED', async () => {
    await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'DELIVERING' });
    await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'AT_DOOR' });
    const res = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'DELIVERED' });

    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal('DELIVERED');

    const txns = await sql`
      SELECT type FROM transactions WHERE order_id = ${orderId}
    `;
    const types = txns.map((t) => t.type).sort();
    expect(types).to.deep.equal(['EARNING', 'TIP']);
  });

  it('returns 404 for unknown order', async () => {
    const res = await request(app)
      .get(`/api/orders/${crypto.randomUUID()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(404);
  });
});