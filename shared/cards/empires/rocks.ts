import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Rocks (Cost 4) - Treasure
 * 1💰. When you gain or trash this, gain a Silver; 
 * if you trashed this, put the Silver on your deck.
 * (Part of the Catapult/Rocks mixed pile)
 */
export const rocks: CardDefinition = {
    id: 'rocks',
    name: 'Pierres',
    description: "1 💰. Lorsque vous recevez ou écartez cette carte, recevez un Argent. Si vous écartez cette carte, l'Argent est reçu sur votre deck.",
    cost: 4,
    types: ['TREASURE'],
    treasureValue: 1,
    effects: [
        { type: 'ADD_MONEY', amount: 1 }
    ],
    onGain: [
        { type: 'GAIN_CARD', cardId: 'silver' }
    ],
    onTrash: [
        { type: 'GAIN_CARD', cardId: 'silver', destination: 'deck' }
    ],
    set: 'empires',
    expansion: 'empires',
    isSubCard: true
};
