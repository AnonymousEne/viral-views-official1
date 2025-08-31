import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../dev-server';

describe('Battles API', () => {
  it('GET /api/battles returns all battles', async () => {
    const res = await request(app).get('/api/battles');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
