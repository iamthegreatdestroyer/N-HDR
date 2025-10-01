# HDR Empire Framework - Docker Container Configuration
#
# Copyright (c) 2025 Stephen Bilodeau
# All rights reserved - Patent Pending
#
# This file is part of the HDR Empire Framework, a proprietary and
# confidential software system. Unauthorized copying, use, distribution,
# or modification of this file or its contents is prohibited.

# Multi-stage build for optimized production image

# Stage 1: Build dependencies
FROM node:18-alpine AS dependencies

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Stage 2: Build application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Run tests (optional - can be disabled for faster builds)
# RUN npm run test

# Stage 3: Production image
FROM node:18-alpine AS production

# Install security updates
RUN apk --no-cache upgrade && \
    apk --no-cache add dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S hdr && \
    adduser -S -D -u 1001 -G hdr hdr

# Set working directory
WORKDIR /app

# Copy production dependencies from dependencies stage
COPY --from=dependencies --chown=hdr:hdr /app/node_modules ./node_modules

# Copy application code
COPY --chown=hdr:hdr . .

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    HDR_LOG_LEVEL=info

# Expose application port
EXPOSE 3000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Switch to non-root user
USER hdr

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "src/index.js"]
