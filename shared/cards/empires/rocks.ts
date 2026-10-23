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
    description: '1 💰. Quand vous recevez ou écartez cette carte, recevez un Argent ; pendant votre phase Achat, placez-le sur votre pioche, sinon prenez-le en main.',
    cost: 4,
    types: ['TREASURE'],
    treasureValue: 1,
    effects: [
        { type: 'ADD_MONEY', amount: 1 }
    ],
    onGain: [{ type: 'ROCKS_SILVER' }] as any,
    onTrash: [{ type: 'ROCKS_SILVER' }] as any,
    expansion: 'empires',
    isSubCard: true
};
