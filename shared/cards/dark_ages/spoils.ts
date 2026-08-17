import { CardDefinition } from '../../types/CardDefinition.js';

export const spoils: CardDefinition = {
    id: 'spoils',
    name: 'Butin',
    cost: 0,
    types: ['TREASURE'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: '3💰. Quand vous jouez cette carte, renvoyez-la dans sa pile.',
    isNonSupply: true,
    effects: [
        { type: 'ADD_MONEY', amount: 3 },
        {
            type: 'SEQUENCE',
            effects: [
                { type: 'RETURN_TO_SUPPLY', min: 1, max: 1, filter: { cardIds: ['spoils'] } }
            ]
        }
    ]
};
