// Unified main server with optional OpenTelemetry + Prometheus metrics
import http from 'http'
import { URL } from 'url'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const port = Number(process.env.PORT || 3000)
const hostname = process.env.HOSTNAME || '0.0.0.0'

// telemetry and metrics placeholders
let promClient = null
let promRegistry = null
let httpRequestsCounter = null
let httpRequestDuration = null

// Attempt to load prom-client dynamically
try {
  promClient = await import('prom-client')
  promRegistry = new promClient.Registry()
  promClient.collectDefaultMetrics({ register: promRegistry })
  httpRequestsCounter = new promClient.Counter({ name: 'http_requests_total', help: 'Total HTTP requests', labelNames: ['method', 'route', 'status'] })
  httpRequestDuration = new promClient.Histogram({ name: 'http_request_duration_seconds', help: 'HTTP request duration (s)', labelNames: ['method', 'route', 'status'] })
  promRegistry.registerMetric(httpRequestsCounter)
  promRegistry.registerMetric(httpRequestDuration)
  console.info('[INFO] prom-client metrics enabled')
} catch (e) {
  promClient = null
}

// Optional OpenTelemetry init (best-effort)
try {
  const otelEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
  if (otelEndpoint) {
    const { NodeSDK } = await import('@opentelemetry/sdk-node')
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-grpc')
    const { getNodeAutoInstrumentations } = await import('@opentelemetry/auto-instrumentations-node')
    const exporter = new OTLPTraceExporter({ url: otelEndpoint })
    const sdk = new NodeSDK({ traceExporter: exporter, instrumentations: [getNodeAutoInstrumentations()] })
    await sdk.start()
    console.info('[INFO] OpenTelemetry SDK started')
  }
} catch (e) {
  console.info('[INFO] OpenTelemetry SDK not started:', e && e.message)
}

function logRequest(req, status) {
  const ua = req.headers['user-agent'] || '-'
  console.info(`[INFO] ${new Date().toISOString()} ${req.method} ${req.url} ${status} - User-Agent: ${ua}`)
}

const appInfo = {
  version: process.env.VERSION || '0.0.1',
  environment: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString()
}

function sendSuccess(res, data, statusCode = 200) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ success: true, data, timestamp: new Date().toISOString() }, null, 2))
}

function sendError(res, statusCode = 500, message = 'Internal Error', details = null) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ success: false, message, details, timestamp: new Date().toISOString() }, null, 2))
}

// Lightweight middleware placeholder
function applyMiddleware(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
}

const routes = {
  '/': (req, res) => {
    const welcomeData = {
      message: 'Hello World! Welcome to the Learn Node.js Microservice',
      application: appInfo,
      endpoints: [
        { path: '/', method: 'GET', description: 'Welcome message and API info' },
        { path: '/ping', method: 'GET', description: 'Simple ping-pong response' },
        { path: '/healthz', method: 'GET', description: 'Health check endpoint' },
        { path: '/info', method: 'GET', description: 'Application information' },
        { path: '/metrics', method: 'GET', description: 'Prometheus metrics (if enabled)' }
      ]
    }
    sendSuccess(res, welcomeData)
  },

  '/ping': (req, res) => {
    res.setHeader('Content-Type', 'text/plain')
    res.statusCode = 200
    res.end('pong')
  },

  '/healthz': (req, res) => {
    const healthData = {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      version: appInfo.version,
      environment: appInfo.environment
    }
    sendSuccess(res, healthData)
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
    }
    sendSuccess(res, systemInfo)
  }
}

export const createApp = () => {
  return http.createServer(async (req, res) => {
    const start = Date.now()
    try {
      // Log request (status will be set after handling)
      applyMiddleware(req, res)

      if (req.method === 'OPTIONS') {
        res.statusCode = 204
        res.end()
        return
      }

      const urlObj = new URL(req.url, `http://${req.headers.host}`)
      const pathname = urlObj.pathname

      // metrics endpoint
      if (req.method === 'GET' && pathname === '/metrics') {
        if (!promRegistry) {
          res.writeHead(204)
          res.end()
          return
        }
        const body = await promRegistry.metrics()
        res.writeHead(200, { 'Content-Type': promClient.register.contentType })
        res.end(body)
        logRequest(req, 200)
        if (httpRequestsCounter) httpRequestsCounter.inc({ method: req.method, route: pathname, status: 200 })
        if (httpRequestDuration) httpRequestDuration.observe({ method: req.method, route: pathname, status: 200 }, (Date.now() - start) / 1000)
        return
      }

      if (routes[pathname] && req.method === 'GET') {
        routes[pathname](req, res)
        logRequest(req, res.statusCode || 200)
        if (httpRequestsCounter) httpRequestsCounter.inc({ method: req.method, route: pathname, status: res.statusCode || 200 })
        if (httpRequestDuration) httpRequestDuration.observe({ method: req.method, route: pathname, status: res.statusCode || 200 }, (Date.now() - start) / 1000)
        return
      }

      if (req.method !== 'GET') {
        sendError(res, 405, 'Method Not Allowed', `Method ${req.method} is not allowed for this endpoint`)
        logRequest(req, 405)
        return
      }

      sendError(res, 404, 'Not Found', `The endpoint ${pathname} does not exist`)
      logRequest(req, 404)
    } catch (error) {
      console.error('[ERROR] Server error:', error)
      sendError(res, 500, 'Internal Server Error', error && error.message)
      logRequest(req, 500)
    }
  })
}

const server = createApp()

// Start server only if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  server.listen(port, hostname, () => {
    console.info(`[INFO] 🚀 Server running at http://${hostname}:${port}/`)
    console.info(`[INFO] 📊 Environment: ${appInfo.environment}`)
    console.info(`[INFO] 📦 Version: ${appInfo.version}`)
    console.info(`[INFO] 🕐 Started at: ${appInfo.timestamp}`)
  })
}

export default createApp
