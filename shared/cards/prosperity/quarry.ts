import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Quarry - Prosperity 2nd Edition
 * Cost: 4
 * Types: TREASURE
 * Text: 1 Money. While this is in play, Action cards cost 2 less (but not less than 0).
 */
export const quarry: CardDefinition = {
    id: 'quarry',
    name: 'Carrière',
    cost: 4,
    types: ['TREASURE'],
    expansion: 'Prosperity',
    set: 'prosperity',
    description: 'Vaut 1 💰. Tant que cette carte est en jeu, les cartes Action coûtent 2 💰 de moins (minimum 0).',
    treasureValue: 1,
    effects: [
        { type: 'ADD_MONEY', amount: 1 }
    ]
};
