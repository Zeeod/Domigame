import { CardDefinition } from '../../types/CardDefinition.js';

export const University: CardDefinition = {
    id: 'university',
    name: 'Université',
    types: ['ACTION'],
    cost: 2,
    potionCost: 1,
    expansion: 'alchemy',
    set: 'Alchemy',
    description: "+2 Actions.\nRecevez une carte Action coûtant jusqu'à 5 pièces.",
    effects: [
        {
            type: 'ADD_ACTIONS',
            amount: 2
        },
        {
            type: 'GAIN_CARD',
            minDecoratedCost: 0,
            maxDecoratedCost: 5, // Engine handles coin cost <= 5.
            // Assumption: maxDecoratedCost handles basic coin cost.
            // If strict adherence to "Action card costing up to 5", we need a filter.
            allowedTypes: ['ACTION'],
            message: 'Recevez une carte Action coûtant jusqu\'à 5 pièces'
        }
    ]
};
