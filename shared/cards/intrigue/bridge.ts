import { CardDefinition } from '../../types/CardDefinition.js';

export const bridge: CardDefinition = {
    id: 'bridge',
    name: 'Pont',
    cost: 4,
    types: ['ACTION'],
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'ADD_MONEY', amount: 1 },
        { type: 'ADD_COST_REDUCTION', amount: 1 },
    ],
    description: '+1 Achat ; +1 ??. Ce tour-ci, toutes les cartes (y compris celles en main) coûtent 1 ?? de moins, mais pas moins de 0 ??.',
    image: '/card-images/bridge.jpg',
    expansion: 'Intrigue'
};
