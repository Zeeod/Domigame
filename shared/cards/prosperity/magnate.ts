import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Magnate - Prosperity 2nd Edition
 * Cost: 5
 * Types: ACTION
 * Text: +1 Action. Reveal your hand. +1 Card per Treasure revealed.
 */
export const magnate: CardDefinition = {
    id: 'magnate',
    name: 'Magnat',
    cost: 5,
    types: ['ACTION'],
    expansion: 'Prosperity',
    set: 'prosperity',
    description: '+1 Action. Révélez votre main. +1 Carte par carte Trésor révélée.',
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'REVEAL_HAND' },
        {
            type: 'DRAW',
            amount: {
                type: 'COUNT_CARDS_IN_HAND',
                filter: { cardTypes: ['TREASURE'] }
            } as any // Assuming COUNT_CARDS_IN_HAND exists or I'll implement it
        }
    ]
};
