import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('GET /health - Service Health & Dependency Check', () => {
  it('should return 200 OK with server status and connected database state', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toMatchObject({
      status: 'ok',
      service: 'incubyte-dealership-backend',
      database: 'connected',
    });
    expect(typeof response.body.data.uptime).toBe('number');
    expect(typeof response.body.data.timestamp).toBe('string');
  });

  it('should return 404 for unknown endpoints with standard error format', async () => {
    const response = await request(app).get('/api/unknown-endpoint-route');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
  });
});
