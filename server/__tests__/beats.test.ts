import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../dev-server';

describe('Beats API', () => {
  it('GET /api/beats returns all beats', async () => {
    const res = await request(app).get('/api/beats');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
