import { CardDefinition } from '../../types/CardDefinition';

export const tidePools: CardDefinition = {
    id: 'tide_pools',
    name: 'Piscines à marée',
    types: ['ACTION', 'DURATION'],
    cost: 4,
    description: '+3 Cartes ; +1 Action. Au début de votre prochain tour : défaussez 2 cartes.',
    set: 'seaside',
    effects: [
        {
            type: 'DRAW',
            amount: 3
        },
        {
            type: 'ADD_ACTIONS',
            amount: 1
        }
    ],
    durationEffects: [
        {
            type: 'DISCARD',
            min: 2,
            max: 2,
            message: 'Défaussez 2 cartes (effet Crique).'
        }
    ]
};
