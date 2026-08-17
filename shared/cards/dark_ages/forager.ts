import { CardDefinition } from '../../types/CardDefinition.js';

export const forager: CardDefinition = {
    id: 'forager',
    name: 'Glaneuse',
    cost: 3,
    types: ['ACTION'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: '+1 Action, +1 Achat. Écartez une carte de votre main. +1 💰 par type de Trésor différent dans le Rebut.',
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'TRASH', min: 1, max: 1, from: 'hand' },
        { type: 'ADD_MONEY_PER_UNIQUE_TREASURE_IN_TRASH' } as any
    ]
};
