import express from 'express';
import { createServer } from "http";
import { Server } from "socket.io";
import path from 'path';
import { fileURLToPath } from 'url';
import { setupSocketHandlers } from "./SocketHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Use environment variables or defaults
const PORT = process.env.PORT || 3005;
const CLIENT_URL = process.env.CLIENT_URL || "*";
const SOCKET_PATH = process.env.SOCKET_PATH || "/socket.io/";

// Reverse proxy support
app.set('trust proxy', 1);

const io = new Server(httpServer, {
    path: SOCKET_PATH,
    cors: {
        origin: CLIENT_URL,
        methods: ["GET", "POST"]
    }
});

setupSocketHandlers(io);

// Serve static files from 'dist' directory
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Health check
app.get('/health', (_req, res) => res.send('OK'));

// SPA Fallback: for everything else, serve index.html
// SPA Fallback: for everything else, serve index.html
app.get(/.*/, (req, res, _next) => {
    if (req.path.includes('.')) return _next();
    res.sendFile(path.join(distPath, 'index.html'));
});

httpServer.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`[SERVER] Error: Port ${PORT} is already in use.`);
        console.error(`[SERVER] Please kill the process using this port before starting.`);
        process.exit(1);
    } else {
        console.error('[SERVER] Server error:', e);
    }
});

// Comprehensive Error Handling
process.on('uncaughtException', (err) => {
    console.error('[SERVER] FATAL: Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[SERVER] FATAL: Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

httpServer.listen(PORT, () => {
    console.log(`[SERVER] Authoritative Server running on :${PORT}`);
});
