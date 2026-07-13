import { app, request, signupAndLogin, createCourier, deleteCourier, expect } from './helpers.js';

describe('Auth', () => {
  it('signs up a new courier and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: `signup-${crypto.randomUUID()}@example.com`, password: 'password123', name: 'New' });

    if (res.body.token) await deleteCourier(res.body.courier.id);
    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('token');
    expect(res.body.courier).to.have.property('email');
  });

  it('rejects signup with missing fields (400)', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'incomplete@example.com' });
    expect(res.status).to.equal(400);
    expect(res.body.error).to.equal('ValidationError');
  });

  it('rejects signup with short password (400)', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'short@example.com', password: '123', name: 'X' });
    expect(res.status).to.equal(400);
  });

  it('rejects duplicate email (409)', async () => {
    const email = `dup-${crypto.randomUUID()}@example.com`;
    const first = await request(app)
      .post('/api/auth/signup')
      .send({ email, password: 'password123', name: 'Dup' });
    const second = await request(app)
      .post('/api/auth/signup')
      .send({ email, password: 'password123', name: 'Dup' });

    if (first.body.courier) await deleteCourier(first.body.courier.id);
    expect(second.status).to.equal(409);
  });

  it('logs in with correct credentials (200)', async () => {
    const email = `login-${crypto.randomUUID()}@example.com`;
    const signup = await request(app)
      .post('/api/auth/signup')
      .send({ email, password: 'password123', name: 'Login' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'password123' });

    if (signup.body.courier) await deleteCourier(signup.body.courier.id);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('token');
  });

  it('rejects wrong password (401)', async () => {
    const email = `wrong-${crypto.randomUUID()}@example.com`;
    const signup = await request(app)
      .post('/api/auth/signup')
      .send({ email, password: 'password123', name: 'Wrong' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'wrongpass' });

    if (signup.body.courier) await deleteCourier(signup.body.courier.id);
    expect(res.status).to.equal(401);
  });

  it('requires auth on protected routes (401)', async () => {
    const res = await request(app).get('/api/courier/me');
    expect(res.status).to.equal(401);
  });

  it('logs out with a valid token (200)', async () => {
    const email = `logout-${crypto.randomUUID()}@example.com`;
    const body = await signupAndLogin(email);
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${body.token}`);
    await deleteCourier(body.courier.id);
    expect(res.status).to.equal(200);
  });
});