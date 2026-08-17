import * as fs from 'fs';
import { createGameState, GameState } from '../../shared/engine/GameState.js';
import { createPlayerState, PlayerState } from '../../shared/engine/PlayerState.js';
import { updateSelection } from '../../shared/types/GameAction.js';
import { GameRoomV2 } from '../GameRoomV2.js';
import { Server } from 'socket.io';
import assert from 'assert';

const logFile = 'persistence_test_output.log';
fs.writeFileSync(logFile, ''); // Clear file

function logToFile(msg: string) {
    fs.appendFileSync(logFile, msg + '\n');
    process.stdout.write(msg + '\n');
}

const originalLog = console.log;
const originalError = console.error;
console.log = (msg: any, ...args: any[]) => { logToFile([msg, ...args].join(' ')); };
console.error = (msg: any, ...args: any[]) => { logToFile('ERROR: ' + [msg, ...args].join(' ')); };

// Mock Socket.IO
const mockIo = {
    on: () => { },
    emit: () => { },
    to: () => ({ emit: () => { } })
} as any as Server;

async function runTest() {
    console.log('🧪 Starting Selection Persistence Test');
    let failures = 0;

    try {
        // Setup
        const room = new GameRoomV2(mockIo, 'test-room', {});
        const p1 = createPlayerState('p1', 'Player 1');
        room.gameState = createGameState('test-seed');
        room.gameState.players.push(p1);
        room.isStarted = true;

        console.log('--- Test 1: Update Selection ---');
        const selection = ['card_123', 'card_456'];
        const action = updateSelection(selection);

        // Mock getPlayerIdBySocket (since we can't easily mock the socket map directly without private access)
        // We'll trust handleAction logic if we can bypass the socket lookup or mock it
        // Since getPlayerIdBySocket is public? No it's private usually or protected. checks source...
        // public getPlayerIdBySocket(socketId: string): string | undefined
        // It is public in the outline!

        // We need to register the player first to have a socket mapping
        // But addPlayer needs a socket.
        // Let's hack it: Access private map if possible or just use a mock socket?

        // Let's rely on the fact that handleAction calls getPlayerIdBySocket.
        // We can create a mock socket and add the player.
        const mockSocket = { id: 'socket_p1', emit: () => { }, on: () => { }, join: () => { } } as any;
        room.addPlayer(mockSocket, 'Player 1', '#fff', 'token_p1');


        // Actually addPlayer creates a NEW logic player if not strictly controlled.
        // In GameRoomV2, addPlayer adds to room.players. 
        // We ideally want room.gameState.players to match.
        // room.startGame() creates the gameState from room.players.
        // So let's use standard flow.

        const room2 = new GameRoomV2(mockIo, 'test-room-2', { minPlayers: 1 });
        room2.addPlayer(mockSocket, 'Player 1', '#fff', 'token_p1');
        room2.startGame(['village']); // Minimal setup

        // Now p1 index 0 should be our player.
        const pState = room2.gameState.players[0];

        const res = room2.handleAction('socket_p1', updateSelection(selection));

        if (!res.success) {
            console.error('handleAction Error:', res.error);
        }

        assert(res.success, 'Action should be success');
        assert.deepEqual(pState.currentSelection, selection, 'PlayerState.currentSelection should match payload');
        console.log('✅ Update Selection success');

        console.log('--- Test 2: Clear Selection (Empty) ---');
        room2.handleAction('socket_p1', updateSelection([]));
        assert.deepEqual(pState.currentSelection, [], 'Selection should be empty');
        console.log('✅ Clear Selection success');

    } catch (e) {
        console.error('❌ Test Failed:', e);
        failures++;
    }

    if (failures === 0) {
        console.log('🎉 All selection persistence tests passed!');
    } else {
        process.exit(1);
    }
}

runTest();
