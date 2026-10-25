import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app, {
  isAllowedOrigin,
  VERCEL_PROJECT_ORIGIN_REGEX,
  LOCALHOST_ORIGIN_REGEX,
} from '../../src/app.js';

describe('CORS Integration & Preflight Handling', () => {
  const PRODUCTION_ORIGIN = 'https://incubyte-assessment-ruby.vercel.app';
  const SUPPLIED_PREVIEW_ORIGIN =
    'https://incubyte-assessment-5rx0o8f4n-subhadeepdhar563-9243s-projects.vercel.app';
  const BRANCH_PREVIEW_ORIGIN =
    'https://incubyte-assessment-git-main-subhadeepdhar563-9243s-projects.vercel.app';
  const LOCALHOST_ORIGIN = 'http://localhost:5173';
  const LOCALHOST_IP_ORIGIN = 'http://127.0.0.1:5173';
  const UNAPPROVED_MALICIOUS_ORIGIN = 'https://evil-unauthorized-site.com';
  const UNAPPROVED_OTHER_VERCEL_ORIGIN = 'https://some-other-project.vercel.app';
  const UNAPPROVED_SPOOFED_ORIGIN = 'https://incubyte-assessment.attacker.com';

  describe('OPTIONS Preflight Handling', () => {
    it('should successfully handle preflight OPTIONS from the supplied Vercel preview origin', async () => {
      const response = await request(app)
        .options('/api/vehicles?page=1&limit=10')
        .set('Origin', SUPPLIED_PREVIEW_ORIGIN)
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Content-Type, Authorization');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe(SUPPLIED_PREVIEW_ORIGIN);
      expect(response.headers['access-control-allow-credentials']).toBe('true');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['access-control-allow-methods']).toContain('OPTIONS');
      expect(response.headers['access-control-allow-headers']).toContain('Content-Type');
      expect(response.headers['access-control-allow-headers']).toContain('Authorization');
    });

    it('should successfully handle preflight OPTIONS from the production Vercel domain', async () => {
      const response = await request(app)
        .options('/api/vehicles?page=1&limit=10')
        .set('Origin', PRODUCTION_ORIGIN)
        .set('Access-Control-Request-Method', 'GET');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe(PRODUCTION_ORIGIN);
      expect(response.headers['access-control-allow-credentials']).toBe('true');
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });

    it('should successfully handle preflight OPTIONS from branch preview deployment origins', async () => {
      const response = await request(app)
        .options('/api/vehicles?page=1&limit=10')
        .set('Origin', BRANCH_PREVIEW_ORIGIN)
        .set('Access-Control-Request-Method', 'POST');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe(BRANCH_PREVIEW_ORIGIN);
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should successfully handle preflight OPTIONS from localhost development origins', async () => {
      const response = await request(app)
        .options('/api/vehicles')
        .set('Origin', LOCALHOST_ORIGIN)
        .set('Access-Control-Request-Method', 'GET');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe(LOCALHOST_ORIGIN);

      const ipResponse = await request(app)
        .options('/api/vehicles')
        .set('Origin', LOCALHOST_IP_ORIGIN)
        .set('Access-Control-Request-Method', 'GET');

      expect(ipResponse.status).toBe(204);
      expect(ipResponse.headers['access-control-allow-origin']).toBe(LOCALHOST_IP_ORIGIN);
    });

    it('should omit Access-Control-Allow-Origin for unapproved origins during preflight', async () => {
      const response = await request(app)
        .options('/api/vehicles?page=1&limit=10')
        .set('Origin', UNAPPROVED_MALICIOUS_ORIGIN)
        .set('Access-Control-Request-Method', 'GET');

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('should omit Access-Control-Allow-Origin for other unrelated Vercel apps during preflight', async () => {
      const response = await request(app)
        .options('/api/vehicles?page=1&limit=10')
        .set('Origin', UNAPPROVED_OTHER_VERCEL_ORIGIN)
        .set('Access-Control-Request-Method', 'GET');

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('Actual Inventory Requests (GET /api/vehicles)', () => {
    it('should allow actual vehicle inventory request from the supplied Vercel preview origin', async () => {
      const response = await request(app)
        .get('/api/vehicles?page=1&limit=10')
        .set('Origin', SUPPLIED_PREVIEW_ORIGIN);

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe(SUPPLIED_PREVIEW_ORIGIN);
      expect(response.headers['access-control-allow-credentials']).toBe('true');
      expect(response.body).toHaveProperty('success', true);
    });

    it('should allow actual vehicle inventory request from the production Vercel origin', async () => {
      const response = await request(app)
        .get('/api/vehicles?page=1&limit=10')
        .set('Origin', PRODUCTION_ORIGIN);

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe(PRODUCTION_ORIGIN);
      expect(response.headers['access-control-allow-credentials']).toBe('true');
      expect(response.body).toHaveProperty('success', true);
    });

    it('should omit Access-Control-Allow-Origin for unapproved origins on GET requests', async () => {
      const response = await request(app)
        .get('/api/vehicles?page=1&limit=10')
        .set('Origin', UNAPPROVED_MALICIOUS_ORIGIN);

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('should succeed for non-browser requests with no Origin header (e.g. curl / health checks)', async () => {
      const response = await request(app).get('/api/vehicles?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('Origin Pattern Matching Unit Validation', () => {
    it('should validate project Vercel pattern regex correctly', () => {
      expect(VERCEL_PROJECT_ORIGIN_REGEX.test(PRODUCTION_ORIGIN)).toBe(true);
      expect(VERCEL_PROJECT_ORIGIN_REGEX.test(SUPPLIED_PREVIEW_ORIGIN)).toBe(true);
      expect(VERCEL_PROJECT_ORIGIN_REGEX.test(BRANCH_PREVIEW_ORIGIN)).toBe(true);
      expect(VERCEL_PROJECT_ORIGIN_REGEX.test('https://incubyte-assessment.vercel.app')).toBe(true);

      // Rejection of non-matching or malicious domains
      expect(VERCEL_PROJECT_ORIGIN_REGEX.test(UNAPPROVED_MALICIOUS_ORIGIN)).toBe(false);
      expect(VERCEL_PROJECT_ORIGIN_REGEX.test(UNAPPROVED_OTHER_VERCEL_ORIGIN)).toBe(false);
      expect(VERCEL_PROJECT_ORIGIN_REGEX.test(UNAPPROVED_SPOOFED_ORIGIN)).toBe(false);
      expect(VERCEL_PROJECT_ORIGIN_REGEX.test('https://evil-incubyte-assessment.vercel.app')).toBe(
        false,
      );
      expect(VERCEL_PROJECT_ORIGIN_REGEX.test('http://incubyte-assessment-ruby.vercel.app')).toBe(
        false,
      );
    });

    it('should validate localhost pattern regex correctly', () => {
      expect(LOCALHOST_ORIGIN_REGEX.test('http://localhost:5173')).toBe(true);
      expect(LOCALHOST_ORIGIN_REGEX.test('http://localhost:3000')).toBe(true);
      expect(LOCALHOST_ORIGIN_REGEX.test('http://127.0.0.1:5173')).toBe(true);
      expect(LOCALHOST_ORIGIN_REGEX.test('http://127.0.0.1:4173')).toBe(true);
      expect(LOCALHOST_ORIGIN_REGEX.test('https://localhost:5173')).toBe(true);
      expect(LOCALHOST_ORIGIN_REGEX.test('http://localhost.attacker.com')).toBe(false);
    });

    it('should correctly evaluate isAllowedOrigin helper', () => {
      expect(isAllowedOrigin(PRODUCTION_ORIGIN)).toBe(true);
      expect(isAllowedOrigin(SUPPLIED_PREVIEW_ORIGIN)).toBe(true);
      expect(isAllowedOrigin(LOCALHOST_ORIGIN)).toBe(true);
      expect(isAllowedOrigin(UNAPPROVED_MALICIOUS_ORIGIN)).toBe(false);
      expect(isAllowedOrigin(UNAPPROVED_OTHER_VERCEL_ORIGIN)).toBe(false);
      expect(isAllowedOrigin('')).toBe(false);
    });
  });
});
