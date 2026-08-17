import { CardDefinition } from '../../types/CardDefinition';

export const wharf: CardDefinition = {
    id: 'wharf',
    name: 'Quai',
    types: ['ACTION', 'DURATION'],
    description: '+2 Cartes ; +1 Achat. Au début de votre prochain tour : +2 Cartes ; +1 Achat.',
    cost: 5,
    set: 'seaside',
    effects: [
        { type: 'DRAW', amount: 2 },
        { type: 'ADD_BUYS', amount: 1 }
    ],
    durationEffects: [
        { type: 'DRAW', amount: 2 },
        { type: 'ADD_BUYS', amount: 1 }
    ]
};
