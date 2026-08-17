import { CardDefinition } from '../../types/CardDefinition';

export const lighthouse: CardDefinition = {
    id: 'lighthouse',
    name: 'Gardien de phare',
    types: ['ACTION', 'DURATION'],
    description: '+1 Action. Maintenant et jusqu\'au début de votre prochain tour, vous n\'êtes pas affecté par les Attaques. Au début de votre prochain tour : +1 Pièce.',
    cost: 2,
    set: 'seaside',
    blocksAttack: true, // Passive property handled by engine triggers
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_MONEY', amount: 1 }
    ],
    durationEffects: [
        { type: 'ADD_MONEY', amount: 1 }
    ]
};
