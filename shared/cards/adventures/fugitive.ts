import { CardDefinition } from '../../types/CardDefinition.js';

export const fugitive: CardDefinition = {
    id: 'fugitive',
    name: 'Fugitif',
    types: ['ACTION', 'TRAVELLER'],
    cost: 4,
    expansion: 'adventures',
    set: 'adventures',
    isNonSupply: true,
    description: '+2 Cartes, +1 Action. Défaussez une carte. Quand vous défaussez du jeu, vous pouvez échanger contre un Disciple.',
    effects: [
        { type: 'DRAW', amount: 2 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'DISCARD', min: 1, max: 1, message: 'Défaussez une carte.' }
    ],
    upgradesTo: 'disciple'
};
