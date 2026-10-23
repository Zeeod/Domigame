import { CardDefinition } from '../../types/CardDefinition.js';

export const spoils: CardDefinition = {
    id: 'spoils',
    name: 'Butin',
    cost: 0,
    types: ['TREASURE'],
    expansion: 'dark_ages',
    description: '3💰. Quand vous jouez cette carte, renvoyez-la dans sa pile.',
    isNonSupply: true,
    effects: [
        { type: 'ADD_MONEY', amount: 3 },
        { type: 'RETURN_TO_PILE' }
    ] as any
};
