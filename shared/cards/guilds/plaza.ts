import { CardDefinition } from '../../types/CardDefinition.js';

export const plaza: CardDefinition = {
    id: 'plaza',
    name: 'Place',
    types: ['ACTION'],
    cost: 4,
    expansion: 'guilds',
    set: 'guilds',
    description: '+1 Carte, +2 Actions. Vous pouvez défausser un Trésor pour +1 Coffre.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 2 },
        {
            type: 'DISCARD',
            min: 0,
            max: 1,
            filter: { cardTypes: ['TREASURE'] },
            message: 'Défaussez un Trésor pour +1 Coffre',
            onSuccess: [{ type: 'ADD_COFFERS', amount: 1 }]
        } as any
    ]
};
