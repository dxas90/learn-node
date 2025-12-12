// Unified main server with optional OpenTelemetry + Prometheus metrics
import http, { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import type * as PromClient from 'prom-client';

const port = Number(process.env.PORT || 3000);
const hostname = process.env.HOST || '0.0.0.0';

// TypeScript interfaces
interface AppInfo {
  version: string;
  environment: string;
  timestamp: string;
}

interface HealthData {
  status: string;
  uptime: number;
  timestamp: string;
  memory: NodeJS.MemoryUsage;
  version: string;
  environment: string;
}

interface SystemInfo {
  application: AppInfo;
  system: {
    platform: NodeJS.Platform;
    arch: string;
    nodeVersion: string;
    uptime: number;
    memory: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
  environment: {
    nodeEnv: string | undefined;
    port: number;
    hostname: string;
  };
}

interface VersionData {
  version: string;
  name: string;
  environment: string;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  details?: string | null;
  timestamp: string;
}

// telemetry and metrics placeholders
let promClient: typeof PromClient | null = null;
let promRegistry: InstanceType<typeof PromClient.Registry> | null = null;
let httpRequestsCounter: InstanceType<typeof PromClient.Counter> | null = null;
let httpRequestDuration: InstanceType<typeof PromClient.Histogram> | null = null;

// Attempt to load prom-client dynamically
try {
  promClient = await import('prom-client');
  promRegistry = new promClient.Registry();
  promClient.collectDefaultMetrics({ register: promRegistry });
  httpRequestsCounter = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status']
  });
  httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration (s)',
    labelNames: ['method', 'route', 'status']
  });
  promRegistry.registerMetric(httpRequestsCounter);
  promRegistry.registerMetric(httpRequestDuration);
  console.info('[INFO] prom-client metrics enabled');
} catch (_e) {
  promClient = null;
}

// Optional OpenTelemetry init (best-effort)
try {
  const otelEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (otelEndpoint) {
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-grpc');
    const { getNodeAutoInstrumentations } = await import('@opentelemetry/auto-instrumentations-node');
    const exporter = new OTLPTraceExporter({ url: otelEndpoint });
    const sdk = new NodeSDK({
      traceExporter: exporter,
      instrumentations: [getNodeAutoInstrumentations()]
    });
    await sdk.start();
    console.info('[INFO] OpenTelemetry SDK started');
  }
} catch (e) {
  console.info('[INFO] OpenTelemetry SDK not started:', e instanceof Error ? e.message : String(e));
}

function logRequest(req: IncomingMessage, status: number): void {
  const ua = req.headers['user-agent'] || '-';
  console.info(`[INFO] ${new Date().toISOString()} ${req.method} ${req.url} ${status} - User-Agent: ${ua}`);
}

const appInfo: AppInfo = {
  version: process.env.VERSION || '0.0.1',
  environment: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString()
};

function sendSuccess<T>(res: ServerResponse, data: T, statusCode = 200): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };
  res.end(JSON.stringify(response, null, 2));
}

function sendError(res: ServerResponse, statusCode = 500, message = 'Internal Error', details: string | null = null): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  const response: ApiResponse = {
    success: false,
    message,
    details,
    timestamp: new Date().toISOString()
  };
  res.end(JSON.stringify(response, null, 2));
}

// Lightweight middleware placeholder
function applyMiddleware(_req: IncomingMessage, res: ServerResponse): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
}

type RouteHandler = (req: IncomingMessage, res: ServerResponse) => void;

const routes: Record<string, RouteHandler> = {
  '/': (_req, res) => {
    const welcomeData = {
      message: 'Hello World! Welcome to the Learn Node.js Microservice',
      application: appInfo,
      endpoints: [
        { path: '/', method: 'GET', description: 'Welcome message and API info' },
        { path: '/ping', method: 'GET', description: 'Simple ping-pong response' },
        { path: '/healthz', method: 'GET', description: 'Health check endpoint' },
        { path: '/info', method: 'GET', description: 'Application information' },
        { path: '/version', method: 'GET', description: 'Application version information' },
        { path: '/echo', method: 'POST', description: 'Echo back the request body' },
        { path: '/metrics', method: 'GET', description: 'Prometheus metrics (if enabled)' }
      ]
    };
    sendSuccess(res, welcomeData);
  },

  '/ping': (_req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.statusCode = 200;
    res.end('pong');
  },

  '/healthz': (_req, res) => {
    const healthData: HealthData = {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      version: appInfo.version,
      environment: appInfo.environment
    };
    sendSuccess(res, healthData);
  },

  '/info': (_req, res) => {
    const systemInfo: SystemInfo = {
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
  },

  '/version': (_req, res) => {
    const versionData: VersionData = {
      version: appInfo.version,
      name: 'learn-node',
      environment: appInfo.environment
    };
    sendSuccess(res, versionData);
  }
};

export const createApp = (): http.Server => {
  return http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const start = Date.now();
    try {
      // Log request (status will be set after handling)
      applyMiddleware(req, res);

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }

      const urlObj = new URL(req.url!, `http://${req.headers.host}`);
      const pathname = urlObj.pathname;

      // metrics endpoint
      if (req.method === 'GET' && pathname === '/metrics') {
        if (!promRegistry) {
          res.writeHead(204);
          res.end();
          return;
        }
        const body = await promRegistry.metrics();
        res.writeHead(200, { 'Content-Type': promClient!.register.contentType });
        res.end(body);
        logRequest(req, 200);
        if (httpRequestsCounter) httpRequestsCounter.inc({ method: req.method, route: pathname, status: 200 });
        if (httpRequestDuration)
          httpRequestDuration.observe(
            { method: req.method, route: pathname, status: 200 },
            (Date.now() - start) / 1000
          );
        return;
      }

      if (routes[pathname] && req.method === 'GET') {
        routes[pathname](req, res);
        logRequest(req, res.statusCode || 200);
        if (httpRequestsCounter)
          httpRequestsCounter.inc({ method: req.method, route: pathname, status: res.statusCode || 200 });
        if (httpRequestDuration)
          httpRequestDuration.observe(
            { method: req.method, route: pathname, status: res.statusCode || 200 },
            (Date.now() - start) / 1000
          );
        return;
      }

      // Handle POST /echo
      if (req.method === 'POST' && pathname === '/echo') {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            const echoData = {
              received: parsed,
              timestamp: new Date().toISOString(),
              message: 'Echo successful'
            };
            sendSuccess(res, echoData);
            logRequest(req, 200);
            if (httpRequestsCounter) httpRequestsCounter.inc({ method: req.method, route: pathname, status: 200 });
            if (httpRequestDuration)
              httpRequestDuration.observe(
                { method: req.method, route: pathname, status: 200 },
                (Date.now() - start) / 1000
              );
          } catch (_err) {
            sendError(res, 400, 'Bad Request', 'Invalid JSON in request body');
            logRequest(req, 400);
          }
        });
        return;
      }

      if (req.method !== 'GET') {
        sendError(res, 405, 'Method Not Allowed', `Method ${req.method} is not allowed for this endpoint`);
        logRequest(req, 405);
        return;
      }

      sendError(res, 404, 'Not Found', `The endpoint ${pathname} does not exist`);
      logRequest(req, 404);
    } catch (error) {
      console.error('[ERROR] Server error:', error);
      sendError(res, 500, 'Internal Server Error', error instanceof Error ? error.message : String(error));
      logRequest(req, 500);
    }
  });
};

const server = createApp();

// Start server only if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  server.listen(port, hostname, () => {
    console.info(`[INFO] 🚀 Server running at http://${hostname}:${port}/`);
    console.info(`[INFO] 📊 Environment: ${appInfo.environment}`);
    console.info(`[INFO] 📦 Version: ${appInfo.version}`);
    console.info(`[INFO] 🕐 Started at: ${appInfo.timestamp}`);
  });
}

export default createApp;
