# Learn Node.js Microservice - AI Coding Assistant Guide

## Project Overview

This is a **cloud-native Node.js microservice** designed for learning containerization and Kubernetes deployment. It's a production-ready microservice with comprehensive DevOps practices, not a traditional web application.

**Key Architecture:**
- Single-file HTTP server (`main.js`) using native Node.js `http` module (no Express)
- ES6 modules (`type: "module"` in package.json)
- Multi-stage Dockerfile optimized for production
- Helm chart with comprehensive K8s resources in `k8s/learn-node/`
- Security-first approach with manual header implementation

## Critical Developer Workflows

### Primary Entry Points
- **Makefile is the orchestrator**: Use `make help` to see all available commands
- `make quick-start`: Clean install → test → run locally
- `make full-pipeline`: Test → security scan → Docker build → compose up
- `npm run dev`: Hot-reload development (nodemon watches `main.js` only)

### Testing Strategy
```bash
# Jest requires experimental VM modules flag (ES6 modules)
npm test  # Runs: node --experimental-vm-modules node_modules/.bin/jest

# Coverage thresholds enforced at 75% (not 80% as README states)
# See jest.config.js lines 20-26
```

### Version Management
- **Git-based versioning**: Makefile uses git tags/branches/commits (lines 7-27)
- Version strategy priority: `tag` > `branch` (if not main/master) > `commit_hash`
- Helm chart version in `k8s/learn-node/Chart.yaml` uses FluxCD image policy comments
- `VERSION` file contains `0.0.1` but is **not the source of truth**

### Deployment Patterns

**Docker multi-stage builds:**
- `base` → `development` | `deps` → `production`
- Production stage uses `dumb-init` for proper signal handling
- Health check embedded in Dockerfile (uses inline Node.js script)

**Kubernetes deployment:**
- **Don't use** `kubectl apply -f k8s/` directly (Makefile prevents this)
- Use `make helm-deploy` which runs: `helm upgrade --install learn-node ./charts/learn-node`
- Note: Helm chart path is `./charts/learn-node` in Makefile but actual location is `k8s/learn-node/`

**Environment injection pattern:**
```yaml
# Deployment uses ConfigMap + Secret + optional common-secrets/settings
envFrom:
  - configMapRef: { name: learn-node-config }
  - secretRef: { name: learn-node-secret }
  # Conditional common resources (values.yaml lines 56-62)
```

## Project-Specific Conventions

### Code Structure
- **Single responsibility**: `main.js` exports `createApp()` function for testing
- **No framework dependencies**: HTTP server, routing, middleware all hand-rolled
- **Manual security headers**: No helmet dependency in production (see lines 20-30)
- **Response helpers**: `sendSuccess()` and `sendError()` standardize JSON responses

### ESLint Configuration
- Flat config format (eslint.config.js, not .eslintrc)
- **File-specific rule overrides**:
  - `main.js`: allows `process.exit` and `console` (graceful shutdown)
  - Test files: `no-console` disabled
  - Uses `@eslint/js` recommended base

### Port Discrepancy Pattern
- **Application runs on port 3000** (main.js, Dockerfile)
- **Kubernetes Service exposes port 3000** (values.yaml line 7)
- **Container ports**: `containerPort: 3000` in deployment.yaml (line 73)
- Health probes target `/healthz` on `http` port (liveness) or port 3000 (readiness)

### Testing Approach
```javascript
// Tests use supertest against createApp() (main.test.js)
import { createApp } from './main.js';
const app = createApp();
await request(app).get('/healthz').expect(200);

// Coverage excludes config files explicitly (jest.config.js lines 37-43)
```

## Critical Integration Points

### Mise Tooling
- `mise.toml` manages: Node 24, kubectl, sops, helm, task
- PROJECT_NAME derived from directory name dynamically

### CI/CD Pipeline
- GitHub Actions: `.github/workflows/full-workflow.yml`
- Matrix testing: Node 20 & 22
- Helm unit tests run with `helm-unittest` plugin (outputs JUnit XML)
- Tests currently have `continue-on-error: true` (TODO: enforce passing)

### Helm Chart Structure
- Uses `_helpers.tpl` with `base.*` named templates (not chart name)
- HTTPRoute (Gateway API) conditionally enabled via `values.httproute.enabled`
- PVC, autoscaling, and common secrets/settings all optional
- Chart tests in `k8s/learn-node/tests/` with README documenting assertions

## Common Gotchas

1. **Don't add Express**: This project intentionally uses raw `http` module
2. **Nodemon only watches main.js**: Add files to `nodemon.json` watch array
3. **Health endpoint mismatch**: Code uses `/healthz`, some configs reference both 3000 and 3000
4. **Make targets assume Helm**: kubectl-based deployment will fail validation
5. **ESLint no-process-exit**: Disabled only for `main.js`, don't use elsewhere
6. **Renovate auto-merge**: Configured with `:automergeBranch` for dependency updates

## Key Files Reference

- `main.js`: Single-file server with routes object (lines 76-118)
- `Makefile`: Lines 38-256 contain all developer workflows
- `k8s/learn-node/values.yaml`: Service port 3000, app runs on 3000
- `jest.config.js`: ES6 modules setup, 75% coverage threshold
- `Dockerfile`: Multi-stage with labels and health check (lines 60-74)
- `.github/workflows/full-workflow.yml`: CI pipeline with matrix testing

## When Making Changes

**Adding routes**: Update `routes` object in `main.js` (line 76) and endpoint list (line 84)

**Modifying K8s resources**: Update Helm templates + add tests in `k8s/learn-node/tests/`

**Dependency changes**: Renovate handles updates automatically (runs before 5:30am)

**Security headers**: Modify `applyMiddleware()` function (lines 19-31), don't add helmet

**Environment variables**: Add to ConfigMap template and document in values.yaml
