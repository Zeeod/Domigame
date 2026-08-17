import { CardDefinition } from '../../types/CardDefinition.js';

export const Scholar: CardDefinition = {
    id: 'scholar',
    name: 'Érudit',
    types: ['ACTION'],
    cost: 5,
    effects: [
        {
            type: 'DISCARD',
            forceAll: true,
            from: 'hand',
        },
        {
            type: 'DRAW',
            amount: 7,
        },
    ],
    description: "Écartez votre main. +7 Cartes.",
    expansion: 'Renaissance',
    set: 'renaissance'
};
