# Multi-stage build for optimization
# Build/dev stages use the full node:26-alpine image (includes npm).
# Production stage uses a minimal runtime image without npm/corepack to
# eliminate CVEs that live in npm's bundled binaries (tar, sigstore, etc.).

FROM node:26-alpine3.24 AS base

RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache dumb-init && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

COPY package*.json ./

# Development stage
FROM base AS development
ENV NODE_ENV=development
RUN npm ci --include=dev
COPY . .
USER nodejs
EXPOSE 3000
CMD ["dumb-init", "npm", "run", "dev"]

# Build stage for TypeScript compilation
FROM base AS builder
ENV NODE_ENV=development
RUN npm ci --include=dev
COPY . .
RUN npm run build

# Production dependencies stage
FROM base AS deps
ENV NODE_ENV=production
RUN npm ci --omit=dev && \
    npm cache clean --force && \
    # Delete npm itself so the runtime image doesn't ship with CVEs
    # found in npm's bundled binaries (tar, sigstore, pacote, etc.).
    rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
           /usr/local/lib/node_modules/corepack /usr/local/bin/corepack \
           /opt/yarn-* /usr/local/bin/yarn /usr/local/bin/yarnpkg

# Production runtime stage (no npm, no corepack, no yarn)
FROM alpine:3.24 AS production

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache nodejs-current dumb-init tzdata ca-certificates && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy production dependencies (npm already stripped in deps stage)
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy compiled JavaScript from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --chown=nodejs:nodejs ./package.json ./package.json

# Create .env file with defaults
RUN printf 'NODE_ENV=production\nPORT=3000\nHOST=0.0.0.0\n' > .env && \
    chown nodejs:nodejs .env

USER nodejs

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/healthz', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

EXPOSE 3000

CMD ["dumb-init", "node", "dist/main.js"]

ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

LABEL maintainer="Daniel Ramirez <daniel@example.com>" \
      org.label-schema.name="learn-node" \
      org.label-schema.description="A modern Node.js microservice for learning containerization" \
      org.label-schema.version=${VERSION} \
      org.label-schema.build-date=${BUILD_DATE} \
      org.label-schema.vcs-ref=${VCS_REF} \
      org.label-schema.vcs-url="https://github.com/dxas90/learn-node" \
      org.label-schema.schema-version="1.0"
