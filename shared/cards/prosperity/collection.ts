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
    expansion: 'prosperity',
    description: '2 💰. +1 Achat. Ce tour-ci, quand vous recevez une carte Action, +1 🛡️.',
    treasureValue: 2,
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'ADD_BUYS', amount: 1 },
        {
            type: 'REGISTER_TRIGGER', trigger: 'ON_GAIN', duration: 'TURN', repeat: true,
            filter: { cardTypes: ['ACTION'] },
            effects: [{ type: 'ADD_VICTORY_TOKENS', amount: 1 }],
            description: 'Collection : +1 🛡️'
        }
    ] as any,
    // Trigger on gain of Action cards handled by engine
};
