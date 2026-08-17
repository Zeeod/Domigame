import { CardDefinition } from '../../types/CardDefinition.js';

export const stables: CardDefinition = {
    id: 'stables',
    name: 'Écuries',
    types: ['ACTION'],
    cost: 5,
    expansion: 'hinterlands',
    set: 'hinterlands',
    description: 'Vous pouvez défausser un Trésor. Si vous le faites, +3 Cartes et +1 Action.',
    effects: [
        {
            type: 'DISCARD',
            min: 0,
            max: 1,
            filter: { cardTypes: ['TREASURE'] },
            message: 'Défaussez un Trésor pour +3 Cartes et +1 Action',
            onSuccess: [
                { type: 'DRAW', amount: 3 },
                { type: 'ADD_ACTIONS', amount: 1 }
            ]
        }
    ] as any
};
