import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Hoard - Prosperity 2nd Edition
 * Cost: 6
 * Types: TREASURE
 * Text: 2$. While this is in play, when you buy a Victory card, gain a Gold.
 */
export const hoard: CardDefinition = {
    id: 'hoard',
    name: 'Trésor caché',
    cost: 6,
    types: ['TREASURE'],
    expansion: 'Prosperity',
    set: 'prosperity',
    description: 'Vaut 2 💰. Tant que cette carte est en jeu, quand vous achetez une carte Victoire, gagnez un Or.',
    treasureValue: 2,
    effects: [
        { type: 'ADD_MONEY', amount: 2 }
    ],
    triggers: [
        {
            trigger: 'ON_BUY',
            filter: { cardTypes: ['VICTORY'] },
            effects: [
                { type: 'GAIN_CARD', cardId: 'gold', destination: 'discardPile' }
            ]
        }
    ]
};
