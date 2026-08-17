import { CardDefinition } from '../../types/CardDefinition';

export const caravan: CardDefinition = {
    id: 'caravan',
    name: 'Caravane',
    types: ['ACTION', 'DURATION'],
    description: '+1 Carte ; +1 Action. Au début de votre prochain tour : +1 Carte.',
    cost: 4,
    set: 'seaside',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 }
    ],
    durationEffects: [
        { type: 'DRAW', amount: 1 }
    ]
};
