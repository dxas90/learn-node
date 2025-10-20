import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import http from 'http';
import { URL } from 'url';

// Import the server logic (we'll need to refactor main.js to export the server)
// For now, we'll create a test server with the same logic

let server;
let baseURL;

// Server logic extracted for testing
const createTestServer = () => {
  const testServer = http.createServer((req, res) => {
    // Apply middleware
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'");

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    // Parse URL
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const pathname = urlObj.pathname;

    // Route handling
    try {
      if (pathname === '/' && req.method === 'GET') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        const response = {
          success: true,
          data: {
            message: 'Hello World! Welcome to the Learn Node.js Microservice',
            application: {
              name: 'learn-node',
              version: '1.0.0',
              environment: 'test'
            }
          },
          timestamp: new Date().toISOString()
        };
        res.end(JSON.stringify(response, null, 2));
      } else if (pathname === '/ping' && req.method === 'GET') {
        res.setHeader('Content-Type', 'text/plain');
        res.statusCode = 200;
        res.end('pong');
      } else if (pathname === '/healthz' && req.method === 'GET') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        const response = {
          success: true,
          data: {
            status: 'healthy',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
          }
        };
        res.end(JSON.stringify(response, null, 2));
      } else if (pathname === '/info' && req.method === 'GET') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        const response = {
          success: true,
          data: {
            application: {
              name: 'learn-node',
              version: '1.0.0',
              environment: 'test'
            },
            system: {
              platform: process.platform,
              arch: process.arch,
              nodeVersion: process.version
            }
          }
        };
        res.end(JSON.stringify(response, null, 2));
      } else if (req.method !== 'GET') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          error: true,
          message: 'Method Not Allowed',
          statusCode: 405
        }));
      } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          error: true,
          message: 'Not Found',
          statusCode: 404
        }));
      }
    } catch (error) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: true,
        message: 'Internal Server Error',
        statusCode: 500
      }));
    }
  });

  return testServer;
};

beforeAll((done) => {
  server = createTestServer();
  server.listen(0, () => {
    const port = server.address().port;
    baseURL = `http://localhost:${port}`;
    done();
  });
});

afterAll((done) => {
  server.close(done);
});

describe('Learn Node.js Microservice', () => {
  describe('GET /', () => {
    test('should return welcome message and API info', async () => {
      const response = await request(server).get('/');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('Hello World');
      expect(response.body.data.application).toBeDefined();
      expect(response.body.data.application.name).toBe('learn-node');
      expect(response.body.timestamp).toBeDefined();
    });

    test('should include security headers', async () => {
      const response = await request(server).get('/');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['content-security-policy']).toBe("default-src 'self'");
    });

    test('should include CORS headers', async () => {
      const response = await request(server).get('/');

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
    });
  });

  describe('GET /ping', () => {
    test('should return pong', async () => {
      const response = await request(server).get('/ping');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/text\/plain/);
      expect(response.text).toBe('pong');
    });
  });

  describe('GET /healthz', () => {
    test('should return health status', async () => {
      const response = await request(server).get('/healthz');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.uptime).toBeGreaterThanOrEqual(0);
      expect(response.body.data.timestamp).toBeDefined();
    });

    test('should return valid ISO timestamp', async () => {
      const response = await request(server).get('/healthz');

      const timestamp = response.body.data.timestamp;
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });
  });

  describe('GET /info', () => {
    test('should return application and system information', async () => {
      const response = await request(server).get('/info');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body.success).toBe(true);
      expect(response.body.data.application).toBeDefined();
      expect(response.body.data.system).toBeDefined();
      expect(response.body.data.system.platform).toBeDefined();
      expect(response.body.data.system.arch).toBeDefined();
      expect(response.body.data.system.nodeVersion).toBeDefined();
    });
  });

  describe('Error handling', () => {
    test('should return 404 for unknown routes', async () => {
      const response = await request(server).get('/unknown-route');

      expect(response.status).toBe(404);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body.error).toBe(true);
      expect(response.body.message).toBe('Not Found');
      expect(response.body.statusCode).toBe(404);
    });

    test('should return 405 for unsupported methods', async () => {
      const response = await request(server).post('/');

      expect(response.status).toBe(405);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body.error).toBe(true);
      expect(response.body.message).toBe('Method Not Allowed');
      expect(response.body.statusCode).toBe(405);
    });
  });

  describe('CORS preflight', () => {
    test('should handle OPTIONS requests', async () => {
      const response = await request(server).options('/');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
    });
  });

  describe('Performance tests', () => {
    test('should respond quickly to health checks', async () => {
      const start = Date.now();
      const response = await request(server).get('/healthz');
      const end = Date.now();
      const responseTime = end - start;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(100); // Should respond within 100ms
    });

    test('should handle multiple concurrent requests', async () => {
      const requests = Array(10).fill().map(() => request(server).get('/ping'));
      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.text).toBe('pong');
      });
    });
  });
});
