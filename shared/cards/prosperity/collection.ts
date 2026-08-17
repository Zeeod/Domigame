import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Collection - Prosperity 2nd Edition
 * Cost: 5
 * Types: TREASURE
 * Text: 2$. +1 Buy. While this is in play, when you gain an Action card, +1 VP.
 */
export const collection: CardDefinition = {
    id: 'collection',
    name: 'Collection',
    cost: 5,
    types: ['TREASURE'],
    expansion: 'Prosperity',
    set: 'prosperity',
    description: 'Vaut 2 💰. +1 Achat. Tant que cette carte est en jeu, quand vous gagnez une carte Action, gagnez 1 jeton VP.',
    treasureValue: 2,
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'ADD_BUYS', amount: 1 }
    ]
    // Trigger on gain of Action cards handled by engine
};
