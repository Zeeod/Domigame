import { CardDefinition } from '../../types/CardDefinition.js';

export const conspirator: CardDefinition = {
    id: 'conspirator',
    name: 'Conspirateur',
    cost: 4,
    types: ['ACTION'],
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        {
            type: 'CONDITION',
            condition: 'ACTIONS_PLAYED',
            comparator: '>=',
            value: 3,
            trueEffects: [
                { type: 'DRAW', amount: 1 },
                { type: 'ADD_ACTIONS', amount: 1 }
            ]
        }
    ],
    description: '+2 ??. Si vous avez joué au moins 3 cartes Action ce tour-ci (celle-ci incluse) : +1 Carte ; +1 Action.',
    image: '/card-images/conspirator.jpg',
    expansion: 'Intrigue'
};
