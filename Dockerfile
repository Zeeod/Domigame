# ==============================================================================
# Dominion — one container: the game server also serves the web client.
# Node 24: the saves use Node's built-in SQLite (node:sqlite, Node 22.5 or newer).
# ==============================================================================

# ---------- Stage 1: build the web client (Vite) ----------
FROM node:24-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Uses .env.production (VITE_SERVER_URL empty: the client talks to the server that serves it)
RUN npm run build

# ---------- Stage 2: runtime ----------
FROM node:24-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Saved games (SQLite) live here: mount a volume to keep them across updates
RUN mkdir -p /app/data
VOLUME ["/app/data"]

ENV NODE_ENV=production \
    PORT=3005
EXPOSE 3005

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD wget -qO- http://127.0.0.1:${PORT}/health || exit 1

CMD ["npx", "tsx", "server/index.ts"]
