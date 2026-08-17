import { CardDefinition } from '../../types/CardDefinition';

export const fishingVillage: CardDefinition = {
    id: 'fishing_village',
    name: 'Village de pêcheurs',
    types: ['ACTION', 'DURATION'],
    cost: 3,
    description: '+2 Actions ; +1 Pièce\nAu début de votre prochain tour : +1 Action ; +1 Pièce.',
    set: 'seaside',
    effects: [
        { type: 'ADD_ACTIONS', amount: 2 },
        { type: 'ADD_MONEY', amount: 1 }
    ],
    durationEffects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_MONEY', amount: 1 }
    ]
};
