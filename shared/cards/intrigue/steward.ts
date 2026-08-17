import { CardDefinition } from '../../types/CardDefinition.js';

export const steward: CardDefinition = {
    id: 'steward',
    name: 'Intendant',
    cost: 3,
    types: ['ACTION'],
    effects: [
        {
            type: 'CHOOSE_OPTION',
            count: 1,
            options: [
                { label: '+2 Cartes', effects: [{ type: 'DRAW', amount: 2 }] },
                { label: '+2 ??', effects: [{ type: 'ADD_MONEY', amount: 2 }] },
                { label: 'Écarter 2 cartes', effects: [{ type: 'TRASH', min: 2, max: 2, from: 'hand' }] }
            ]
        }
    ],
    description: 'Choisissez : +2 Cartes ; ou +2 ?? ; ou écartez 2 cartes de votre main.',
    image: '/card-images/steward.jpg',

    expansion: 'Intrigue'
};


