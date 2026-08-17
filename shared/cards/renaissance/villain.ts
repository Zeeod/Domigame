import { CardDefinition } from '../../types/CardDefinition.js';

export const villain: CardDefinition = {
    id: 'villain',
    name: 'Vilain',
    cost: 5,
    types: ['ACTION', 'ATTACK'],
    effects: [
        { type: 'ADD_COFFERS', amount: 2 },
        {
            type: 'ATTACK',
            attackEffects: [
                {
                    type: 'CONDITION',
                    condition: 'HAND_SIZE',
                    comparator: '>=',
                    value: 5,
                    trueEffects: [
                        {
                            type: 'DISCARD',
                            min: 1,
                            max: 1,
                            filter: { minCost: 2 },
                            message: 'Défaussez une carte coûtant 2 ou plus.',
                            forceAll: false // Player chooses
                        }
                    ]
                }
            ]
        }
    ],
    description: '+2 Coffres. Chaque autre joueur avec 5 cartes ou plus en main défausse une carte coûtant 2 pièces ou plus (ou révèle qu\'il ne peut pas).',
    image: '/card-images/villain.jpg',
    expansion: 'Renaissance',
    set: 'renaissance'
};
