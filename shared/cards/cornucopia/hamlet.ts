import { CardDefinition } from '../../types/CardDefinition.js';

export const hamlet: CardDefinition = {
    id: 'hamlet',
    name: 'Hameau',
    types: ['ACTION'],
    cost: 2,
    expansion: 'cornucopia',
    set: 'cornucopia',
    description: '+1 Carte, +1 Action. Vous pouvez défausser une carte pour +1 Action. Vous pouvez défausser une carte pour +1 Achat.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        {
            type: 'DISCARD',
            min: 0,
            max: 1,
            message: 'Défaussez une carte pour +1 Action',
            onSuccess: [{ type: 'ADD_ACTIONS', amount: 1 }]
        } as any,
        {
            type: 'DISCARD',
            min: 0,
            max: 1,
            message: 'Défaussez une carte pour +1 Achat',
            onSuccess: [{ type: 'ADD_BUYS', amount: 1 }]
        } as any
    ]
};
