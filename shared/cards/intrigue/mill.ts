import { CardDefinition } from '../../types/CardDefinition.js';

export const mill: CardDefinition = {
    id: 'mill',
    name: 'Moulin',
    cost: 4,
    types: ['ACTION', 'VICTORY'],
    victoryPoints: 1,
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        {
            type: 'DISCARD',
            min: 0,
            max: 2,
            requiredCount: 2,
            onSuccess: [{ type: 'ADD_MONEY', amount: 2 }]
        }
    ],
    description: '1 PV. +1 Carte ; +1 Action. Vous pouvez défausser 2 cartes pour +2 ??.',
    image: '/card-images/mill.jpg',

    expansion: 'Intrigue'
};
