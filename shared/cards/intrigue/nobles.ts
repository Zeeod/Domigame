import { CardDefinition } from '../../types/CardDefinition.js';

export const nobles: CardDefinition = {
    id: 'nobles',
    name: 'Nobles',
    cost: 6,
    types: ['ACTION', 'VICTORY'],
    victoryPoints: 2,
    effects: [
        {
            type: 'CHOOSE_OPTION',
            count: 1,
            options: [
                { label: '+3 Cartes', effects: [{ type: 'DRAW', amount: 3 }] },
                { label: '+2 Actions', effects: [{ type: 'ADD_ACTIONS', amount: 2 }] }
            ]
        }
    ],
    description: '2 PV. Choisissez : +3 Cartes ; ou +2 Actions.',
    image: '/card-images/nobles.jpg',
    expansion: 'Intrigue'
};
