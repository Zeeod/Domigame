import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Catapult (Cost 3) - Action-Attack
 * +1💰. Trash a card from your hand.
 * If its cost is 3💰 or more, each other player gains a Curse.
 * If it is a Treasure, each other player discards down to 3 cards in hand.
 */
export const catapult: CardDefinition = {
    id: 'catapult',
    name: 'Catapulte',
    description: "1 💰. Écartez une carte de votre main. Si elle coûte 3 ou plus, chaque autre joueur reçoit une Malédiction. Si c'est un Trésor, chaque autre joueur défausse jusqu'à avoir 3 cartes.",
    cost: 3,
    types: ['ACTION', 'ATTACK'],
    effects: [
        { type: 'ADD_MONEY', amount: 1 },
        {
            type: 'TRASH',
            min: 1,
            max: 1,
            source: 'hand',
            onSuccess: [
                {
                    type: 'CONDITION',
                    condition: 'LAST_TRASHED_MIN_COST',
                    value: 3,
                    trueEffects: [
                        {
                            type: 'ATTACK',
                            attackEffects: [{ type: 'GAIN_CARD', cardId: 'curse' }]
                        }
                    ]
                },
                {
                    type: 'CONDITION',
                    condition: 'LAST_TRASHED_HAS_TYPE',
                    value: 'TREASURE',
                    trueEffects: [
                        {
                            type: 'ATTACK',
                            attackEffects: [{ type: 'DISCARD_DOWN_TO', amount: 3 }]
                        }
                    ]
                }
            ]
        }
    ],
    set: 'empires',
    expansion: 'empires',
    isSubCard: true
};
