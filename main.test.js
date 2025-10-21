import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from './main.js';

let app;

beforeAll(() => {
  app = createApp();
});

afterAll(() => {
  // No cleanup needed for supertest
});

describe('Learn Node.js Microservice', () => {
  describe('GET /', () => {
    test('should return welcome message and API info', async () => {
      const response = await request(app).get('/').expect(200).expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('Learn Node.js Microservice');
      expect(response.body.data.endpoints).toBeDefined();
      expect(Array.isArray(response.body.data.endpoints)).toBe(true);
    });

    test('should include security headers', async () => {
      const response = await request(app).get('/').expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });

    test('should include CORS headers', async () => {
      const response = await request(app).get('/').expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });
  });

  describe('GET /ping', () => {
    test('should return pong', async () => {
      const response = await request(app).get('/ping').expect(200).expect('Content-Type', /text/);

      expect(response.text).toBe('pong');
    });
  });

  describe('GET /healthz', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/healthz')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.uptime).toBeDefined();
    });

    test('should return valid ISO timestamp', async () => {
      const response = await request(app).get('/healthz').expect(200);

      const timestamp = response.body.data.timestamp;
      expect(timestamp).toBeDefined();
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });
  });

  describe('GET /info', () => {
    test('should return application and system information', async () => {
      const response = await request(app).get('/info').expect(200).expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data.application).toBeDefined();
      expect(response.body.data.system).toBeDefined();
      expect(response.body.data.application.name).toBe('learn-node');
    });
  });

  describe('Error handling', () => {
    test('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown')
        .expect(404)
        .expect('Content-Type', /json/);

      expect(response.body.error).toBe(true);
      expect(response.body.statusCode).toBe(404);
    });

    test('should return 405 for unsupported methods', async () => {
      const response = await request(app).post('/').expect(405).expect('Content-Type', /json/);

      expect(response.body.error).toBe(true);
      expect(response.body.statusCode).toBe(405);
    });
  });

  describe('CORS preflight', () => {
    test('should handle OPTIONS requests', async () => {
      await request(app).options('/').expect(204);
    });
  });

  describe('Performance tests', () => {
    test('should respond quickly to health checks', async () => {
      const start = Date.now();
      await request(app).get('/healthz').expect(200);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    test('should handle multiple concurrent requests', async () => {
      const requests = [];
      for (let i = 0; i < 3; i++) {
        requests.push(request(app).get('/ping').expect(200));
      }

      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect(response.text).toBe('pong');
      });
    });
  });
});
