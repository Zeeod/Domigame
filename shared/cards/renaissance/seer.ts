import { CardDefinition } from '../../types/CardDefinition.js';

export const Seer: CardDefinition = {
    id: 'seer',
    name: 'Voyante',
    types: ['ACTION'],
    cost: 5,
    effects: [
        {
            type: 'DRAW',
            amount: 1,
        },
        {
            type: 'ADD_ACTIONS',
            amount: 1,
        },
        {
            type: 'REVEAL_AND_PUT_IN_HAND',
            count: 3,
            filter: { minCost: 2, maxCost: 4 },
            onOthers: 'DISCARD'
        },
    ],
    description: "+1 Carte. +1 Action. Révélez les 3 cartes du dessus de votre pioche. Mettez les cartes coûtant 2 à 4 Pièces dans votre main et défaussez le reste.",
    expansion: 'Renaissance',
    set: 'renaissance'
};
