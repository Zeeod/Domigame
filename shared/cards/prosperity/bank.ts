import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Bank - Prosperity 2nd Edition
 * Cost: 7
 * Types: TREASURE
 * Text: When you play this, it's worth 1 per Treasure you have in play (including this).
 */
export const bank: CardDefinition = {
    id: 'bank',
    name: 'Banque',
    cost: 7,
    types: ['TREASURE'],
    expansion: 'Prosperity',
    set: 'prosperity',
    description: 'Vaut 1 par carte Trésor que vous avez en jeu (celle-ci incluse).',
    treasureValue: 0, // Dynamic value handled by engine
    effects: [
        {
            type: 'ADD_MONEY',
            amount: { type: 'DYNAMIC', metric: 'TREASURES_IN_PLAY' } as any
        }
    ]
};
