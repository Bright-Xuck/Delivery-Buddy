import { app, request, signupAndLogin, deleteCourier, expect } from './helpers.js';

describe('Shifts', () => {
  let token;
  let courierId;

  beforeEach(async () => {
    const email = `shift-${crypto.randomUUID()}@example.com`;
    const body = await signupAndLogin(email);
    courierId = body.courier.id;
    token = body.token;
  });

  afterEach(async () => {
    if (courierId) await deleteCourier(courierId);
  });

  it('starts a shift (201)', async () => {
    const res = await request(app)
      .post('/api/shifts/start')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(201);
    expect(res.body.status).to.equal('ACTIVE');
  });

  it('rejects starting a second active shift (409)', async () => {
    await request(app).post('/api/shifts/start').set('Authorization', `Bearer ${token}`);
    const res = await request(app)
      .post('/api/shifts/start')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(409);
  });

  it('returns 404 when stopping with no active shift', async () => {
    const res = await request(app)
      .post('/api/shifts/stop')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(404);
  });

  it('stops an active shift (200)', async () => {
    await request(app).post('/api/shifts/start').set('Authorization', `Bearer ${token}`);
    const res = await request(app)
      .post('/api/shifts/stop')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal('ENDED');
  });

  it('returns null for current shift when none active', async () => {
    const res = await request(app)
      .get('/api/shifts/current')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
    expect(res.body).to.equal(null);
  });
});