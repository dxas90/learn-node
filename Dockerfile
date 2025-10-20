# Multi-stage build for optimization
FROM node:20-alpine AS base

# Install security updates and create non-root user
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Development stage
FROM base AS development
ENV NODE_ENV=development
RUN npm ci --include=dev
COPY . .
USER nodejs
EXPOSE 3000
CMD ["dumb-init", "npm", "run", "dev"]

# Production dependencies stage
FROM base AS deps
ENV NODE_ENV=production
RUN npm ci --only=production && \
    npm cache clean --force

# Production stage
FROM base AS production

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Copy production dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application files
COPY --chown=nodejs:nodejs ./main.js ./main.js
COPY --chown=nodejs:nodejs ./package.json ./package.json

# Create .env file with defaults
RUN echo "NODE_ENV=production\nPORT=3000\nHOST=0.0.0.0" > .env

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/healthz', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Expose port
EXPOSE 3000

# Use dumb-init for proper signal handling
CMD ["dumb-init", "node", "main.js"]

# Build arguments for metadata
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

# Add labels for metadata
LABEL maintainer="Daniel Ramirez <daniel@example.com>" \
      org.label-schema.name="learn-node" \
      org.label-schema.description="A modern Node.js microservice for learning containerization" \
      org.label-schema.version=${VERSION} \
      org.label-schema.build-date=${BUILD_DATE} \
      org.label-schema.vcs-ref=${VCS_REF} \
      org.label-schema.vcs-url="https://github.com/dxas90/learn-node" \
      org.label-schema.schema-version="1.0"
