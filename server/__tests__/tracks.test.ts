import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../dev-server';

describe('Tracks API', () => {
  it('GET /api/tracks returns all tracks', async () => {
    const res = await request(app).get('/api/tracks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
