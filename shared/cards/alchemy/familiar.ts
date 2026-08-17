import { CardDefinition } from '../../types/CardDefinition.js';

export const Familiar: CardDefinition = {
    id: 'familiar',
    name: 'Familier',
    types: ['ACTION', 'ATTACK'],
    cost: 3,
    potionCost: 1,
    expansion: 'alchemy',
    set: 'Alchemy',
    description: "+1 Carte.\n+1 Action.\nChaque autre joueur reçoit une Malédiction.",
    effects: [
        {
            type: 'DRAW',
            amount: 1
        },
        {
            type: 'ADD_ACTIONS',
            amount: 1
        },
        {
            type: 'ATTACK',
            attackEffects: [
                {
                    type: 'GAIN_CARD',
                    cardId: 'curse'
                }
            ]
        }
    ]
};
