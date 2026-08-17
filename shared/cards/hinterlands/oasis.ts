import { CardDefinition } from '../../types/CardDefinition.js';

export const oasis: CardDefinition = {
    id: 'oasis',
    name: 'Oasis',
    types: ['ACTION'],
    cost: 3,
    expansion: 'hinterlands',
    set: 'hinterlands',
    description: '+1 Carte, +1 Action, +1 💰. Défaussez une carte.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_MONEY', amount: 1 },
        { type: 'DISCARD', min: 1, max: 1, message: 'Défaussez une carte.' }
    ]
};
