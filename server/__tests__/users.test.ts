import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../dev-server';

describe('Users API', () => {
  it('GET /api/users returns all users', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/users/:id returns a user or 404', async () => {
    // Try a known user
    const res = await request(app).get('/api/users/user-1');
    if (res.status === 200) {
      expect(res.body).toHaveProperty('id', 'user-1');
    } else {
      expect(res.status).toBe(404);
    }
  });
});
