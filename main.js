import http from 'http';
import { URL } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const hostname = process.env.HOST || '0.0.0.0';
const port = parseInt(process.env.PORT) || 3000;

// Application metadata
const appInfo = {
  name: 'learn-node',
  version: process.env.npm_package_version || '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString()
};

// Middleware simulation for HTTP server
const applyMiddleware = (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Security headers (helmet-like)
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', 'default-src \'self\'');
};

// Logging middleware
const logRequest = req => {
  if (process.env.NODE_ENV !== 'test') {
    const timestamp = new Date().toISOString();
    console.info(
      `[INFO] ${timestamp} ${req.method} ${req.url} - User-Agent: ${req.headers['user-agent'] || 'Unknown'}`
    );
  }
};

// Error handler
const sendError = (res, statusCode, message, details = null) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');

  const errorResponse = {
    error: true,
    message,
    statusCode,
    timestamp: new Date().toISOString()
  };

  if (details && process.env.NODE_ENV !== 'production') {
    errorResponse.details = details;
  }

  res.end(JSON.stringify(errorResponse, null, 2));
};

// Success response helper
const sendSuccess = (res, data, statusCode = 200) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');

  const response = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };

  res.end(JSON.stringify(response, null, 2));
};

// Route handlers
const routes = {
  '/': (req, res) => {
    const welcomeData = {
      message: 'Hello World! Welcome to the Learn Node.js Microservice',
      application: appInfo,
      endpoints: [
        { path: '/', method: 'GET', description: 'Welcome message and API info' },
        { path: '/ping', method: 'GET', description: 'Simple ping-pong response' },
        { path: '/healthz', method: 'GET', description: 'Health check endpoint' },
        { path: '/info', method: 'GET', description: 'Application information' }
      ]
    };
    sendSuccess(res, welcomeData);
  },

  '/ping': (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.statusCode = 200;
    res.end('pong');
  },

  '/healthz': (req, res) => {
    const healthData = {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      version: appInfo.version,
      environment: appInfo.environment
    };
    sendSuccess(res, healthData);
  },

  '/info': (req, res) => {
    const systemInfo = {
      application: appInfo,
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port,
        hostname
      }
    };
    sendSuccess(res, systemInfo);
  }
};

// Create HTTP server
export const createApp = () => {
  return http.createServer((req, res) => {
    try {
      // Log request
      logRequest(req);

      // Apply middleware
      applyMiddleware(req, res);

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
      if (routes[pathname] && req.method === 'GET') {
        routes[pathname](req, res);
      } else if (req.method !== 'GET') {
        sendError(
          res,
          405,
          'Method Not Allowed',
          `Method ${req.method} is not allowed for this endpoint`
        );
      } else {
        sendError(
          res,
          404,
          'Not Found',
          `The endpoint ${pathname} does not exist or you are not authorized to view it.`
        );
      }
    } catch (error) {
      console.error('[ERROR] Server error:', error);
      sendError(res, 500, 'Internal Server Error', error.message);
    }
  });
};

const server = createApp();

// Graceful shutdown handling
const gracefulShutdown = signal => {
  console.info(`[INFO] ${signal} received. Shutting down gracefully...`);

  server.close(() => {
    console.info('[INFO] HTTP server closed.');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('[ERROR] Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  console.error('[ERROR] Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[ERROR] Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server only if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  server.listen(port, hostname, () => {
    console.info(`[INFO] 🚀 Server running at http://${hostname}:${port}/`);
    console.info(`[INFO] 📊 Environment: ${appInfo.environment}`);
    console.info(`[INFO] 📦 Version: ${appInfo.version}`);
    console.info(`[INFO] 🕐 Started at: ${appInfo.timestamp}`);
  });
}
