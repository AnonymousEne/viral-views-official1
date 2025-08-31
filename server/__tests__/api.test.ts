import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';

// Import your server (adjust path as needed)
import app from '../server/dev-server';

describe('API Endpoints', () => {
  it('GET /api/health returns status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
