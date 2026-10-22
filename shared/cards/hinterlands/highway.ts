import { CardDefinition } from '../../types/CardDefinition.js';

export const highway: CardDefinition = {
    id: 'highway',
    name: 'Grand-route',
    types: ['ACTION'],
    cost: 5,
    expansion: 'hinterlands',
    description: '+1 Carte, +1 Action. Ce tour-ci, les cartes coûtent 1 💰 de moins.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_COST_REDUCTION', amount: 1 }
    ] as any
};
