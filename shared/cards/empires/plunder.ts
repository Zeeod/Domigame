import { CardDefinition } from '../../types/CardDefinition.js';

export const plunder: CardDefinition = {
    id: 'plunder',
    name: 'Butin',
    types: ['TREASURE'],
    cost: 5,
    description: "2$. +1 PV.",
    expansion: 'empires',
    isSubCard: true,
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'ADD_VICTORY_TOKENS', amount: 1 }
    ]
};
