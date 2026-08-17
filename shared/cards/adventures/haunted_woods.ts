import { CardDefinition } from '../../types/CardDefinition.js';

export const hauntedWoods: CardDefinition = {
    id: 'haunted_woods',
    name: 'Bois hantés',
    types: ['ACTION', 'ATTACK', 'DURATION'],
    cost: 5,
    expansion: 'adventures',
    set: 'adventures',
    description: 'Jusqu\'à votre prochain tour, quand un autre joueur achète une carte, il met d\'abord sa main sur sa pioche dans l\'ordre de son choix. Au début de votre prochain tour: +3 Cartes.',
    effects: [
        {
            type: 'ATTACK',
            attackEffects: [{ type: 'HAUNTED_WOODS_EFFECT' }]
        }
    ] as any,
    durationEffects: [
        { type: 'DRAW', amount: 3 }
    ]
};
