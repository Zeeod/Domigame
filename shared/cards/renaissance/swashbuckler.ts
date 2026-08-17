import { CardDefinition } from '../../types/CardDefinition.js';

export const Swashbuckler: CardDefinition = {
    id: 'swashbuckler',
    name: 'Bretteur',
    types: ['ACTION'],
    cost: 5,
    effects: [
        {
            type: 'DRAW',
            amount: 3,
        },
        {
            type: 'CONDITION',
            condition: 'DISCARD_COUNT',
            comparator: '>=',
            value: 1,
            trueEffects: [
                {
                    type: 'ADD_COFFERS',
                    amount: 1,
                },
            ],
        },
        {
            type: 'CONDITION',
            condition: 'COFFERS',
            comparator: '>=',
            value: 4,
            trueEffects: [
                {
                    type: 'TAKE_ARTIFACT',
                    artifact: 'treasure_chest',
                },
            ],
        },
    ],
    description: "+3 Cartes. Si votre défausse contient au moins une carte : +1 Coffre. Si vous avez au moins 4 Coffres : prenez le Coffre au Trésor.",
    expansion: 'Renaissance',
    set: 'renaissance'
};
