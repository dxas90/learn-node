# AI Agent Instructions for learn-node

## Project Overview
This is a **cloud-native Node.js microservice** designed for learning containerization, Kubernetes deployment, and DevOps practices. The application is intentionally simple (basic HTTP server) but with production-grade infrastructure: multi-stage Docker builds, Helm charts, GitHub Actions CI/CD, and comprehensive testing.

## Architecture & Key Patterns

### Application Structure
- **Single-file application**: `main.js` contains the entire HTTP server (no framework, pure Node.js `http` module)
- **ES6 modules**: Uses `import`/`export` syntax (`"type": "module"` in package.json)
- **Environment-driven**: Configuration via `.env` files and environment variables
- **Middleware pattern**: Manual middleware implementation for CORS, security headers, logging

### Critical Naming Convention
**Chart name is `learn-node`** (not `segment-wise-api` - this was recently migrated). Always use:
- Helm chart path: `k8s/learn-node/`
- Docker repo: `dxas90/learn-node`
- App label: `app.kubernetes.io/name: learn-node`
- Service name: `learn-node`

### Template System (Helm)
- Uses `base.*` helper functions (see `k8s/learn-node/templates/_helpers.tpl`)
- Test release name is always `RELEASE-NAME` in unit tests
- Default image: `dxas90/learn-node:latest`
- Service port: **8080** (not 3000 - deployment uses PORT=8080)

## Development Workflows

### Running Tests
```bash
# Unit tests (uses node --experimental-vm-modules for ES6 modules)
npm test

# Coverage (critical: script is 'test:coverage', not 'test:cov')
npm run test:coverage

# Helm unit tests (requires helm-unittest plugin)
helm unittest k8s/learn-node/ --color
```

### Docker Builds
```bash
# Makefile handles versioning via git tags/branches
make docker-build

# Multi-stage Dockerfile has 3 stages:
# - base: Alpine with dumb-init + non-root user (nodejs:1001)
# - deps: Production dependencies only
# - production: Final minimal image with healthcheck
```

### Kubernetes Testing (Kind Cluster)
The GitHub Actions workflow (`full-workflow.yml`) uses a complete integration test:
1. Builds Docker image and saves as artifact
2. Creates Kind cluster with `kind-config.yaml`
3. Loads image into Kind
4. Deploys PostgreSQL + Redis dependencies
5. Deploys app via Helm with `sample-env.yaml` values
6. Runs `scripts/smoke-test.sh` (basic health checks)
7. Runs `scripts/e2e-test.sh` (endpoint tests, pod resilience)

### Key Make Commands
```bash
make help              # Shows all available commands
make test-coverage     # Run tests with coverage
make docker-build      # Build versioned Docker image
make helm-deploy       # Deploy via Helm (NOT k8s-deploy which expects raw manifests)
make version           # Shows git-based versioning strategy
```

## Testing Conventions

### Jest Configuration
- **ES6 modules**: Uses `node --experimental-vm-modules` (see package.json scripts)
- **Coverage thresholds**: 75% for branches/functions/lines/statements
- **Setup file**: `jest.setup.js` sets 5s test timeout
- **Force exit**: Tests use `forceExit: true` to prevent hanging

### Helm Unit Tests
Located in `k8s/learn-node/tests/`:
- Each resource type has dedicated test file (`deployment_test.yaml`, `service_test.yaml`, etc.)
- Tests verify default values, custom overrides, and conditional resources
- **Port assertions**: Service port is 8080, backend refs use 3000
- **HPA**: Only sets replicas when `autoscaling.enabled: false`

## GitHub Actions Workflow

### Environment Variables
```yaml
APP_NAME: learn-node          # Critical: changed from segment-wise-api
REGISTRY: ghcr.io
IMAGE_NAME: ${{ github.repository }}
CLUSTER_NAME: test-cluster
```

### Job Dependencies
```
lint + test → build → helm-test → test-deployment
                ↓
          cleanup-packages
                ↓
    deploy-staging / deploy-production
```

### Key Gotchas
- Trivy scan only runs on push (not PRs) to avoid missing images
- Kind testing uses image artifact transfer (build → save → load → kind load)
- Helm deployment disables httproute and autoscaling for testing
- Pod selector: `app.kubernetes.io/name=learn-node`

## Security & Production Practices

### Security Headers (in main.js)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy: default-src 'self'
- CORS configurable via `CORS_ORIGIN` env var

### Container Security
- Non-root user (nodejs:1001)
- Read-only root filesystem capability (though currently `false`)
- Drops ALL capabilities
- Uses `dumb-init` for proper signal handling
- Multi-stage build removes dev dependencies

## Common Issues & Solutions

### "segment-wise-api" References
If you see this name anywhere, it's outdated. Replace with `learn-node`.

### Port Confusion
- App listens on `PORT` env var (default 3000, Helm sets 8080)
- Service exposes port 8080 → targetPort 8080
- Backend refs for HTTPRoute use 3000 (legacy, may need update)

### Helm Test Failures
- Check image repository matches `dxas90/learn-node` not `ghcr.io/futurmille/...`
- Verify service port is 8080 in tests
- Ensure metadata names use `RELEASE-NAME-learn-node` pattern

### npm Script Errors
- Use `test:coverage` not `test:cov`
- Tests require `--experimental-vm-modules` flag for ES6 modules
- Format command is `npm run format` (uses Prettier)

## File Locations Reference
- **Main app**: `main.js`
- **Helm chart**: `k8s/learn-node/`
- **Helm tests**: `k8s/learn-node/tests/`
- **Test scripts**: `scripts/smoke-test.sh`, `scripts/e2e-test.sh`
- **CI/CD**: `.github/workflows/full-workflow.yml`
- **Kind config**: `.github/kind-config.yaml`
- **Sample values**: `.github/sample-env.yaml`

## Integration Points
- **PostgreSQL & Redis**: External dependencies deployed from raw YAML in GitHub Actions (URLs in workflow)
- **FluxCD**: Staging/production deployment triggers FluxCD reconciliation
- **Traefik Gateway**: HTTPRoute configured for Gateway API (disabled by default)
- **Codecov**: Coverage uploads to codecov.io (token required)

When making changes to Helm templates, **always update corresponding unit tests** in `k8s/learn-node/tests/`. When modifying workflow, ensure chart paths use `learn-node` not `segment-wise-api`.
