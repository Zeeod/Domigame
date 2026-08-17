# ==============================================================================
# STAGE 1: Build Stage
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
# (Alpine needs some python/make for some native modules, but probably not here)
# RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

# Copy everything else
COPY . .

# Build the frontend (Vite)
# This uses .env.production automatically
RUN npm run build

# ==============================================================================
# STAGE 2: Runtime Stage
# ==============================================================================
FROM node:20-alpine

WORKDIR /app

# Copy package files and install PRODUCTION dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Copy the built client from stage 1
COPY --from=builder /app/dist ./dist

# Copy the server source, shared logic and config
# We use tsx to run the server directly from .ts files for simplicity
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Final environment settings
ENV NODE_ENV=production
ENV PORT=3005

# Expose the internal port
EXPOSE 3005

# We run the server directly skipping clean_ports.js which is not needed in Docker
CMD ["npx", "tsx", "server/index.ts"]
