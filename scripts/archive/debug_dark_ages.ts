
import { createGameState } from './shared/engine/GameState.js';
import { SupplyGenerator } from './shared/engine/SupplyGenerator.js';
import { createCardInstances, createCardInstance } from './shared/engine/CardInstance.js';
import { CardRegistry } from './shared/cards/index.js';

// Mock Config
const config = {
    kingdomCards: ['cultist', 'village', 'smithy', 'market', 'laboratory', 'festival', 'witch', 'militia', 'moat', 'workshop'],
    enabledExpansions: ['base', 'dark_ages'],
    sheltersMode: 'random'
};

console.log('--- Debugging Dark Ages Setup ---');

// 1. Check SupplyGenerator logic
const filteredKingdom = config.kingdomCards.filter(id => id);
const useShelters = SupplyGenerator.shouldUseShelters(filteredKingdom, config.sheltersMode as any);
console.log(`Should Use Shelters: ${useShelters}`);

// 2. Check Card Creation
try {
    const hovel = createCardInstance('hovel');
    console.log(`Created Hovel: ${hovel.id}`);
} catch (e) {
    console.error('Failed to create Hovel:', e);
}

// 3. Simulate GameRoomV2 Logic
const useSheltersLogic = useShelters;
if (useSheltersLogic) {
    const hand = [
        ...createCardInstances('copper', 7),
        createCardInstance('hovel'),
        createCardInstance('necropolis'),
        createCardInstance('overgrown_estate')
    ];
    console.log('Hand created:', hand.map(c => c.id).join(', '));
} else {
    console.log('Using Estates (Default)');
}

// 4. Check Mixed Piles (Ruins/Knights)
const ruinsDef = CardRegistry.get('ruins');
console.log('Ruins Definition:', ruinsDef ? 'Found' : 'Missing');
if (ruinsDef && ruinsDef.mixedPile) {
    console.log('Ruins Mixed Pile Cards:', ruinsDef.mixedPile.cards.join(', '));
}

const knightsDef = CardRegistry.get('knights');
console.log('Knights Definition:', knightsDef ? 'Found' : 'Missing');
