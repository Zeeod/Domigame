import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Crown (Cost 5) - Action-Treasure
 * If it's your Action phase, play an Action from your hand twice.
 * If it's your Buy phase, play a Treasure from your hand twice.
 */
export const crown: CardDefinition = {
    id: 'crown',
    name: 'Couronne',
    description: "Si c'est votre phase d'Action, vous pouvez jouer une carte Action de votre main deux fois. Si c'est votre phase d'Achat, vous pouvez jouer un Trésor de votre main deux fois.",
    cost: 5,
    types: ['ACTION', 'TREASURE'],
    effects: [
        {
            type: 'CONDITION',
            condition: 'PHASE',
            value: 'ACTION',
            trueEffects: [
                {
                    type: 'CHOOSE_FROM_ZONE',
                    sourceZone: 'hand',
                    filter: { cardTypes: ['ACTION'] },
                    message: 'Couronne : Choisissez une Action à jouer deux fois',
                    onSuccess: [{ type: 'PLAY_ACTION_TWICE' }]
                }
            ],
            falseEffects: [
                {
                    type: 'CHOOSE_FROM_ZONE',
                    sourceZone: 'hand',
                    filter: { cardTypes: ['TREASURE'] },
                    message: 'Couronne : Choisissez un Trésor à jouer deux fois',
                    onSuccess: [{ type: 'PLAY_ACTION_TWICE' }] // PLAY_ACTION_TWICE should work for any card
                }
            ]
        }
    ],
    set: 'empires',
    expansion: 'empires'
};
