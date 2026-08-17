
import { CardRegistry } from './shared/cards/index.js';
import { createGameState } from './shared/engine/GameState.js';
import { createPlayerState } from './shared/engine/PlayerState.js';
import { createCardInstance } from './shared/engine/CardInstance.js';

// Mock GameRoomV2.ts initialization logic
function mockInitSupply(kingdomCardIds) {
    const state = createGameState('test_room');
    const numPlayers = 2;
    state.supply = {
        copper: { cardId: 'copper', count: 60 - (numPlayers * 7) },
    };

    for (const cardId of kingdomCardIds) {
        if (!cardId) continue;
        const def = CardRegistry.get(cardId);
        if (def?.mixedPile) {
            const baseCards = [...def.mixedPile.cards];
            state.supply[cardId] = {
                cardId,
                count: baseCards.length,
                isMixed: true,
                mixedStack: baseCards.map(id => createCardInstance(id))
            };

            if (def.mixedPile.type === 'SHUFFLED' && state.supply[cardId].mixedStack) {
                const stack = state.supply[cardId].mixedStack;
                for (let i = stack.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [stack[i], stack[j]] = [stack[j], stack[i]];
                }
            }
        } else {
            state.supply[cardId] = { cardId, count: 10 };
        }
    }
    return state;
}

console.log('--- VERIFICATION START ---');
const kingdom = ['knights', 'village', 'smithy'];
const state = mockInitSupply(kingdom);

const knightSupply = state.supply['knights'];
console.log('Knights Pile:', knightSupply ? 'PRESENT' : 'MISSING');
console.log('Mixed Stack:', knightSupply?.isMixed ? 'YES' : 'NO');
console.log('Stack Count:', knightSupply?.count);

const stackIds = knightSupply?.mixedStack.map(inst => inst.cardId) || [];
console.log('Stack IDs:', stackIds.join(','));

const uniqueIds = new Set(stackIds);
console.log('Unique Knights:', uniqueIds.size === 10 ? 'PASS' : `FAIL (${uniqueIds.size}/10)`);

const firstIsAnna = stackIds[0] === 'dame_anna';
console.log('Shuffled:', firstIsAnna ? 'Maybe (1/10)' : 'Likely YES');

console.log('--- CANDIDATES CHECK ---');
const candidates = CardRegistry.getKingdomCandidates();
const indivK = candidates.filter(id => id.startsWith('dame_') || id.startsWith('sir_'));
console.log('Indiv Knights:', indivK.length === 0 ? 'PASS' : 'FAIL (' + indivK.length + ')');
console.log('Knights Pile in Cand:', candidates.includes('knights') ? 'PASS' : 'FAIL');

const indivR = candidates.filter(id => id.startsWith('ruined_') || id === 'abandoned_mine' || id === 'survivors');
console.log('Indiv Ruins:', indivR.length === 0 ? 'PASS' : 'FAIL (' + indivR.length + ')');
console.log('Ruins Pile in Cand:', candidates.includes('ruins') ? 'PASS' : 'FAIL');
console.log('--- VERIFICATION END ---');
