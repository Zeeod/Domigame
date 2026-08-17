import { CardDefinition } from '../../types/CardDefinition.js';

export const highway: CardDefinition = {
    id: 'highway',
    name: 'Grand-route',
    types: ['ACTION'],
    cost: 5,
    expansion: 'hinterlands',
    set: 'hinterlands',
    description: '+1 Carte, +1 Action. Tant que cette carte est en jeu, les cartes coûtent 1 💰 de moins (pas moins de 0).',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'COST_REDUCTION', amount: 1 }
    ] as any
};
