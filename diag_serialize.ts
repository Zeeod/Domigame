import { GameRoomV2 } from './server/GameRoomV2.js';
import { StateSerializerV2 } from './server/StateSerializerV2.js';
import { Server } from 'socket.io';
import { createServer } from 'http';

console.log('--- Serialization Diagnostic Start ---');

const httpServer = createServer();
const io = new Server(httpServer);

const room = new GameRoomV2(io, 'test-room', {
    kingdomCards: ['village', 'smithy', 'market', 'laboratory', 'festival', 'witch', 'militia', 'moat', 'cellar', 'workshop']
});

// Add mock players
(room as any).players = [
    { id: 'p1', socketId: 's1', name: 'Player 1', color: '#ff0000', isHost: true, isReady: true, isConnected: true, isBot: false },
    { id: 'p2', socketId: 's2', name: 'Player 2', color: '#00ff00', isHost: false, isReady: true, isConnected: true, isBot: false }
];

console.log('Starting game...');
room.startGame();

if (room.gameState) {
    console.log('Game started successfully. Phase:', room.gameState.phase);

    console.log('Serializing for Player 1...');
    const start = Date.now();
    const serialized = StateSerializerV2.serialize(room.gameState, 'p1');
    const end = Date.now();

    console.log(`Serialization took ${end - start}ms`);

    const json = JSON.stringify(serialized);
    console.log(`Serialized Size: ${(json.length / 1024).toFixed(2)} KB`);

    if (json.length > 500 * 1024) {
        console.warn('WARNING: Initial state is > 500KB!');
    }

    // Check for obvious bloat
    const parsed = JSON.parse(json);
    console.log('Public Players Count:', parsed.public.players.length);
    console.log('Supply Count:', Object.keys(parsed.public.supply).length);
    console.log('Log Items:', parsed.public.logs.length);
} else {
    console.error('Failed to start game in diagnostic');
}

console.log('--- Serialization Diagnostic End ---');
process.exit(0);
