import { CardDefinition } from '../../types/CardDefinition';

export const haven: CardDefinition = {
    id: 'haven',
    name: 'Havre',
    types: ['ACTION', 'DURATION'],
    description: '+1 Carte ; +1 Action\nMettez une carte de votre main de côté, face cachée.\nAu début de votre prochain tour, reprenez-la.',
    cost: 2,
    set: 'seaside',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        {
            type: 'SET_ASIDE_LINKED',
            count: 1,
            faceDown: true
        }
    ],
    durationEffects: [
        { type: 'RETURN_LINKED_CARDS' }
    ]
};
