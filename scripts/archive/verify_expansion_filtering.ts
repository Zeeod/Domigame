
import { GameRoomV2 } from '../server/GameRoomV2.js';
import { CardRegistry } from '../shared/engine/CardRegistry.js';

// Mock Socket IO
const mockIo = {
    to: () => ({ emit: () => { } }),
    emit: () => { }
} as any;

// Create Room
const room = new GameRoomV2(mockIo, 'test-room');

console.log('--- Initial State ---');
console.log('Enabled Expansions:', room.config.enabledExpansions);
console.log('Initial Kingdom (Random):', room.config.kingdomCards);

// Count initial cards by expansion
let initialCounts: Record<string, number> = {};
room.config.kingdomCards?.forEach(id => {
    const card = CardRegistry.get(id!);
    const exp = (card?.expansion || 'Base').toLowerCase();
    initialCounts[exp] = (initialCounts[exp] || 0) + 1;
});
console.log('Initial Counts:', initialCounts);

// Simulate Host changing Setup to ONLY Intrigue
console.log('\n--- Changing Setup to Intrigue Only ---');
const hostSocketId = 'host-socket'; // Need to mock player
// Mock adding a host player
room.players.push({
    id: 'p1',
    socketId: hostSocketId,
    name: 'Host',
    color: 'red',
    isHost: true,
    isReady: true,
    isConnected: true,
    isBot: false
});
// Need 2 players to start
room.players.push({
    id: 'p2',
    socketId: 'p2-socket',
    name: 'P2',
    color: 'blue',
    isHost: false,
    isReady: true,
    isConnected: true,
    isBot: false
});

room.changeSetupOptions(hostSocketId, { enabledExpansions: ['intrigue'] });
console.log('Updated Config Expansions:', room.config.enabledExpansions);
console.log('Kingdom Cards (Should NOT change yet):', room.config.kingdomCards);
// Note: changeSetupOptions does NOT regenerate cards immediately, only config.

// Simulate Start Game (Random Mode -> null)
console.log('\n--- Starting Game (Random Mode) ---');
room.startGame(null);

console.log('Final Kingdom Cards:', room.config.kingdomCards);

// Verify Final Cards
let finalCounts: Record<string, number> = {};
let allIntrigue = true;
room.config.kingdomCards?.forEach(id => {
    const card = CardRegistry.get(id!);
    const exp = (card?.expansion || 'Base').toLowerCase();
    finalCounts[exp] = (finalCounts[exp] || 0) + 1;
    if (exp !== 'intrigue') {
        allIntrigue = false;
        console.error(`ERROR: Found non-Intrigue card: ${card?.name} (${exp})`);
    }
});
console.log('Final Counts:', finalCounts);

if (allIntrigue) {
    console.log('\nSUCCESS: All cards are from Intrigue!');
} else {
    console.error('\nFAILURE: Found cards from other expansions.');
    process.exit(1);
}
