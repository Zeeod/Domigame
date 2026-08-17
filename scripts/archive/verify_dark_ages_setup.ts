
import { GameRoomV2 } from './server/GameRoomV2.js';
import { CardRegistry } from './shared/cards/index.js';
import { Server } from 'socket.io';

// Mock IO
const mockIo = {
    to: (room) => ({ emit: (evt, data) => console.log(`[IO] to(${room}).emit(${evt})`) }),
    emit: (evt, data) => console.log(`[IO] emit(${evt})`),
    sockets: { sockets: new Map() }
} as any;

const config = {
    kingdomCards: ['cultist', 'village', 'smithy', 'market', 'laboratory', 'festival', 'witch', 'militia', 'moat', 'workshop'],
    enabledExpansions: ['base', 'dark_ages'],
    sheltersMode: 'random'
};

console.log('--- STARTING VERIFICATION ---');

// 1. Create Room
const room = new GameRoomV2(mockIo, 'test_room', config);
console.log('Room created. Config:', room.config);

// 2. Add Players
const s1 = { id: 's1', join: () => { }, emit: () => { } } as any;
const s2 = { id: 's2', join: () => { }, emit: () => { } } as any;

room.addPlayer(s1, 'P1', '#fff', 't1');
room.addPlayer(s2, 'P2', '#000', 't2');
console.log('Players added:', room.players.map(p => ({ n: p.name, ready: p.isReady, host: p.isHost })));

// 3. Set Ready
room.players.forEach(p => p.isReady = true);
console.log('Players set to ready.');

// 4. Start Game
console.log('Calling startGame...');
room.startGame(config.kingdomCards);
console.log('startGame returned. isStarted:', room.isStarted);

if (!room.isStarted) {
    console.error('FAIL: Game did not start.');
    // Check canStart manually
    console.log('canStart check:', room.canStart());
    process.exit(1);
}

// 5. Inspect State
const state = room.gameState;
const p1 = state.players[0];
const handIds = p1.hand.map(c => c.id);

console.log('P1 Hand:', handIds);

const hasShelters = handIds.includes('hovel');
console.log('Has Shelters:', hasShelters);

if (!hasShelters) {
    console.error('FAIL: Hand does not contain Hovel.');
    process.exit(1);
}

console.log('SUCCESS: Shelters found.');
