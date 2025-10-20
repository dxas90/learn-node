# Learn Node.js Microservice 🚀

[![Build Status](https://github.com/dxas90/learn-node/workflows/Docker%20Build%20and%20Security%20Scan/badge.svg)](https://github.com/dxas90/learn-node/actions)
[![Docker Image](https://ghcr.io/dxas90/learn-node/workflows/Docker%20Build%20and%20Security%20Scan/badge.svg)](https://ghcr.io/dxas90/learn-node)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

A modern, secure, and production-ready Node.js microservice designed for learning containerization, Kubernetes deployment, and DevOps best practices.

## 🌟 Features

- **Modern Node.js**: Built with ES6+ modules and latest Node.js features
- **Security First**: Implements security headers, CORS, and follows OWASP guidelines
- **Cloud Native**: Designed for containerization and Kubernetes deployment
- **Health Checks**: Built-in health monitoring and metrics endpoints
- **Comprehensive Testing**: Unit tests, integration tests, and performance tests
- **CI/CD Ready**: GitHub Actions and GitLab CI pipelines included
- **Production Ready**: Proper error handling, logging, and graceful shutdowns

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [API Documentation](#-api-documentation)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Monitoring](#-monitoring)
- [Contributing](#-contributing)
- [License](#-license)

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker (optional)
- Kubernetes cluster (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/dxas90/learn-node.git
   cd learn-node
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Test the application**
   ```bash
   curl http://localhost:3000/healthz
   ```

### Using Docker

1. **Build the Docker image**
   ```bash
   npm run docker:build
   ```

2. **Run the container**
   ```bash
   npm run docker:run
   ```

### Using Kubernetes

1. **Deploy to Kubernetes**
   ```bash
   npm run k8s:deploy
   ```

2. **Check deployment status**
   ```bash
   kubectl get pods -l app=learn-node
   ```

## 📚 API Documentation

### Base URL
- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.com`

### Endpoints

#### `GET /`
Welcome endpoint with API information.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Hello World! Welcome to the Learn Node.js Microservice",
    "application": {
      "name": "learn-node",
      "version": "1.0.0",
      "environment": "production"
    },
    "endpoints": [...]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### `GET /ping`
Simple ping-pong endpoint for basic connectivity testing.

**Response:**
```
pong
```

#### `GET /healthz`
Health check endpoint for monitoring and load balancers.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 123.456,
    "timestamp": "2024-01-01T00:00:00.000Z",
    "memory": {...},
    "version": "1.0.0",
    "environment": "production"
  }
}
```

#### `GET /info`
Detailed application and system information.

**Response:**
```json
{
  "success": true,
  "data": {
    "application": {...},
    "system": {
      "platform": "linux",
      "arch": "x64",
      "nodeVersion": "v20.0.0",
      "uptime": 123.456,
      "memory": {...},
      "cpuUsage": {...}
    },
    "environment": {...}
  }
}
```

### Error Responses

All endpoints return standardized error responses:

```json
{
  "error": true,
  "message": "Error description",
  "statusCode": 404,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🛠️ Development

### Environment Variables

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
CORS_ORIGIN=*
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with hot reload |
| `npm test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format code with Prettier |
| `npm run docker:build` | Build Docker image |
| `npm run docker:run` | Run Docker container |
| `npm run k8s:deploy` | Deploy to Kubernetes |

### Code Quality

This project follows strict code quality standards:

- **ESLint**: JavaScript linting
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **Security**: Helmet.js for security headers
- **CORS**: Cross-origin resource sharing

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

- **Unit Tests**: Test individual functions and modules
- **Integration Tests**: Test API endpoints and workflows
- **Performance Tests**: Test response times and concurrent requests
- **Security Tests**: Test security headers and error handling

### Coverage Requirements

Minimum test coverage thresholds:
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## 🚢 Deployment

### Docker

The application uses multi-stage Docker builds for optimization:

```dockerfile
# Development
docker build --target development -t learn-node:dev .

# Production
docker build --target production -t learn-node:prod .
```

### Kubernetes

1. **Create namespace**
   ```bash
   kubectl create namespace learn-node
   ```

2. **Deploy application**
   ```bash
   kubectl apply -f k8s/ -n learn-node
   ```

3. **Check status**
   ```bash
   kubectl get all -n learn-node
   ```

### Cloud Platforms

#### OpenShift

```bash
oc new-app https://github.com/dxas90/learn-node.git
```

#### Heroku

```bash
git push heroku main
```

#### AWS ECS/EKS

See deployment guides in the `docs/` directory.

## 📊 Monitoring

### Health Checks

The application provides several monitoring endpoints:

- `/healthz` - Kubernetes health checks
- `/ping` - Load balancer health checks
- `/info` - Detailed system information

### Metrics

Key metrics to monitor:

- **Response Time**: < 100ms for health checks
- **Memory Usage**: Monitor for memory leaks
- **CPU Usage**: Track CPU utilization
- **Error Rate**: Monitor 4xx/5xx responses

### Logging

Structured logging with timestamps:

```
[2024-01-01T00:00:00.000Z] GET /healthz - User-Agent: kube-probe/1.28
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests**
   ```bash
   npm test
   ```
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Development Guidelines

- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Use conventional commit messages
- Ensure CI/CD passes

## 🔒 Security

- Security headers implemented via Helmet.js
- CORS properly configured
- Input validation and sanitization
- No hardcoded secrets
- Regular dependency updates
- Container security scanning

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Node.js](https://nodejs.org/) - JavaScript runtime
- [Docker](https://www.docker.com/) - Containerization platform
- [Kubernetes](https://kubernetes.io/) - Container orchestration
- [Jest](https://jestjs.io/) - Testing framework
- [GitHub Actions](https://github.com/features/actions) - CI/CD platform

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/dxas90/learn-node/issues)
- **Discussions**: [GitHub Discussions](https://github.com/dxas90/learn-node/discussions)
- **Email**: daniel@example.com

---

**Happy Coding! 🎉**
