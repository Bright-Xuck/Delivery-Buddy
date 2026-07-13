import { app, request, signupAndLogin, deleteCourier, expect } from './helpers.js';
import sql from '../src/db/connection.js';

describe('Wallet', () => {
  let token;
  let courierId;

  beforeEach(async () => {
    const email = `wallet-${crypto.randomUUID()}@example.com`;
    const body = await signupAndLogin(email);
    courierId = body.courier.id;
    token = body.token;

    await sql`
      INSERT INTO transactions (id, courier_id, order_id, type, amount)
      VALUES (${crypto.randomUUID()}, ${courierId}, NULL, 'EARNING', 100)
    `;
  });

  afterEach(async () => {
    await sql`DELETE FROM transactions WHERE courier_id = ${courierId}`;
    if (courierId) await deleteCourier(courierId);
  });

  it('returns the wallet balance summary (200)', async () => {
    const res = await request(app)
      .get('/api/wallet')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
    expect(res.body.balance).to.equal(100);
    expect(res.body).to.have.property('rate');
    expect(res.body).to.have.property('level');
  });

  it('lists transactions (200)', async () => {
    const res = await request(app)
      .get('/api/wallet/transactions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
    expect(res.body.transactions).to.be.an('array');
    expect(res.body).to.have.property('page');
  });

  it('rejects withdrawal exceeding balance (400)', async () => {
    const res = await request(app)
      .post('/api/wallet/withdraw')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 500 });
    expect(res.status).to.equal(400);
    expect(res.body.error).to.equal('ValidationError');
  });

  it('allows a valid withdrawal (200)', async () => {
    const res = await request(app)
      .post('/api/wallet/withdraw')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 40 });
    expect(res.status).to.equal(200);
    expect(res.body.newBalance).to.equal(60);
  });
});