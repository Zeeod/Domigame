import { CardDefinition } from '../../types/CardDefinition';

export const astrolabe: CardDefinition = {
    id: 'astrolabe',
    name: 'Astrolabe',
    types: ['TREASURE', 'DURATION'],
    cost: 3,
    description: 'Maintenant et au début de votre prochain tour : +1 Achat ; +1 Pièce.',
    set: 'seaside',
    effects: [
        {
            type: 'ADD_BUYS',
            amount: 1
        },
        {
            type: 'ADD_MONEY',
            amount: 1
        }
    ],
    durationEffects: [
        {
            type: 'ADD_BUYS',
            amount: 1
        },
        {
            type: 'ADD_MONEY',
            amount: 1
        }
    ]
};
