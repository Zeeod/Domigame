import { CardDefinition } from '../../types/CardDefinition.js';

export const witchs_hut: CardDefinition = {
    id: 'witchs_hut',
    name: 'Cabane de sorcière',
    cost: 5,
    types: ['ACTION', 'ATTACK'],
    description: '+4 Cartes. Défaussez 2 cartes. Si vous avez défaussé 2 cartes Action, chaque autre joueur gagne une Malédiction.',
    effects: [
        { type: 'DRAW', amount: 4 },
        {
            type: 'DISCARD_WITH_CONDITION',
            min: 2,
            max: 2,
            condition: 'DISCARDED_TYPE_COUNT',
            cardType: 'ACTION',
            // Need to pass cardType via context or if condition supports it?
            // ConditionEffect works with 'cardType'.
            // DiscardWithConditionEffect.condition is type ConditionEffect['condition'].
            // We need a way to pass parameters like 'ACTION' to the condition check.
            // Using 'trueEffects' for the attack.
            trueEffects: [
                {
                    type: 'ATTACK',
                    attackEffects: [
                        { type: 'GAIN_CARD', cardId: 'curse' }
                    ]
                }
            ]
        }
    ],
    expansion: 'Hinterlands',
    set: 'hinterlands',
    isLegacy: false
};
