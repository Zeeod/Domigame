import { CardDefinition } from '../../types/CardDefinition.js';

export const swampHag: CardDefinition = {
    id: 'swamp_hag',
    name: 'Sorcière des marais',
    types: ['ACTION', 'ATTACK', 'DURATION'],
    cost: 5,
    expansion: 'adventures',
    set: 'adventures',
    description: 'Jusqu\'à votre prochain tour, quand un autre joueur achète une carte, il gagne une Malédiction. Au début de votre prochain tour: +3 💰.',
    effects: [
        {
            type: 'ATTACK',
            attackEffects: [{ type: 'SWAMP_HAG_EFFECT' }]
        }
    ] as any,
    durationEffects: [
        { type: 'ADD_MONEY', amount: 3 }
    ]
};
