import { CardDefinition } from '../../types/CardDefinition.js';

export const cauldron: CardDefinition = {
    id: 'cauldron',
    name: 'Chaudron',
    cost: 5,
    types: ['TREASURE'],
    description: '+2 💰. La troisième fois que vous gagnez une Action ce tour-ci, chaque autre joueur gagne une Malédiction.',
    effects: [
        { type: 'ADD_MONEY', amount: 2 }
    ],
    // Trigger needs to be checked dynamically on GAIN event globally or via engine hook
    triggers: [
        {
            trigger: 'ON_GAIN',
            filter: { cardTypes: ['ACTION'] },
            effects: [
                {
                    type: 'CONDITION',
                    condition: 'COUNT_GAINED_THIS_TURN',
                    cardType: 'ACTION',
                    value: 3,
                    comparator: '==',
                    trueEffects: [
                        {
                            type: 'ATTACK',
                            attackEffects: [
                                { type: 'GAIN_CARD', cardId: 'curse' }
                            ]
                        }
                    ]
                }
            ]
        }
    ],
    expansion: 'Hinterlands',
    set: 'hinterlands',
    isLegacy: false
};
