const request = require('supertest');
const app = require('../src/server');

let adminToken, customerToken, managerId;

beforeAll(async () => {
  // Login as admin
  const adminRes = await request(app).post('/api/auth/login').send({ email: 'admin@rentforge.io', password: 'password123' });
  adminToken = adminRes.body.token;

  const custRes = await request(app).post('/api/auth/login').send({ email: 'ravi@ind.com', password: 'password123' });
  customerToken = custRes.body.token;
});

// ─── Auth Tests ───────────────────────────────────────────────
describe('Auth API', () => {
  test('POST /api/auth/login - valid credentials', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'admin@rentforge.io', password: 'password123' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('admin');
  });

  test('POST /api/auth/login - invalid credentials', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'admin@rentforge.io', password: 'wrongpassword' });
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/auth/me - authenticated', async () => {
    const res = await request(app).get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty('email');
    expect(res.body.user).not.toHaveProperty('password');
  });

  test('GET /api/auth/me - unauthenticated', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });
});

// ─── Equipment Tests ──────────────────────────────────────────
describe('Equipment API', () => {
  test('GET /api/equipment - all authenticated users can view', async () => {
    const res = await request(app).get('/api/equipment')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('POST /api/equipment - admin can create', async () => {
    const res = await request(app).post('/api/equipment')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Crane', category: 'crane', dailyRate: 5000, emoji: '🏗️' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  test('POST /api/equipment - customer cannot create', async () => {
    const res = await request(app).post('/api/equipment')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ name: 'Unauthorized Crane', category: 'crane', dailyRate: 1000, emoji: '🏗️' });
    expect(res.statusCode).toBe(403);
  });
});

// ─── RBAC Tests ───────────────────────────────────────────────
describe('RBAC - Role Based Access Control', () => {
  test('GET /api/users - only admin can access', async () => {
    const res = await request(app).get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });

  test('GET /api/users - customer is forbidden', async () => {
    const res = await request(app).get('/api/users')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('GET /api/reports/overview - customer is forbidden', async () => {
    const res = await request(app).get('/api/reports/overview')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(403);
  });
});

// ─── Health Check ─────────────────────────────────────────────
describe('Health Check', () => {
  test('GET /health - returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('OK');
  });
});
