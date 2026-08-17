import { GameRoomV2 } from './server/GameRoomV2.js';
import { GameState } from './shared/engine/GameState.js';

// Setup room like the test
const room = new GameRoomV2({ to: () => ({ emit: () => { } }) } as any, 'test-room', {
    maxPlayers: 2,
    kingdomCards: ['village', 'smithy', 'market']
});

room.addPlayer({ id: 's1', join: () => { } } as any, 'Player 1', 'red', 'p1');
room.addPlayer({ id: 's2', join: () => { } } as any, 'Player 2', 'blue', 'p2');
room.players.forEach(p => p.isReady = true);
room.startGame(['village', 'smithy', 'market']);

const state = room.gameState;
const p1Index = state.players.findIndex(p => p.id === 'p1');
state.currentPlayerIndex = p1Index;
state.phase = 'ACTION';
state.players[p1Index].actions = 1;
state.players[p1Index].coins = 0;
state.players[p1Index].hand = [
    { instanceId: 'c1', id: 'copper', zone: 'hand' },
    { instanceId: 's1', id: 'silver', zone: 'hand' },
    { instanceId: 'v1', id: 'village', zone: 'hand' }
];

// Link sockets
room['socketToPlayer'].set('s1', 'p1');
room['socketToPlayer'].set('s2', 'p2');

console.log("Before action:");
console.log("Current player index:", state.currentPlayerIndex);
console.log("Phase:", state.phase);
console.log("Pipeline:", state.phasePipeline);
console.log("Pipeline index:", state.phaseIndex);

const result = room.handleAction('s1', { type: 'END_PHASE' });

console.log("\nAfter action:");
console.log("handleAction result:", result);
console.log("Phase:", room.gameState.phase);
console.log("Pipeline:", room.gameState.phasePipeline);
console.log("Pipeline index:", room.gameState.phaseIndex);
