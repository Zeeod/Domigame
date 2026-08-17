
import { GameRoomV2 } from './server/GameRoomV2.js';
import { Server } from 'socket.io';
import { createServer } from 'http';

console.log('Attempting to load GameRoomV2...');
try {
    const httpServer = createServer();
    const io = new Server(httpServer);
    const room = new GameRoomV2(io, 'TEST');
    console.log('Successfully created GameRoomV2 instance.');
} catch (e) {
    console.error('FAILED to load GameRoomV2:', e);
    process.exit(1);
}
