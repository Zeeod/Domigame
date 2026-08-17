import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Patrician (Cost 2) - Action
 * +1 Card, +1 Action.
 * Reveal the top card of your deck; if it costs 5💰 or more, put it into your hand.
 */
export const patrician: CardDefinition = {
    id: 'patrician',
    name: 'Patricien',
    description: "+1 Carte. +1 Action. Révélez la carte du dessus de votre deck. Si elle coûte 5 💰 ou plus, prenez-la en main.",
    cost: 2,
    types: ['ACTION'],
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        {
            type: 'REVEAL_TOP_OF_DECK',
            amount: 1,
            onSuccess: [
                {
                    type: 'CONDITION',
                    condition: { type: 'MIN_COST', amount: 5 } as any,
                    trueEffects: [{ type: 'MOVE_CARDS', source: 'aside', destination: 'hand', count: 1 }],
                    falseEffects: [{ type: 'MOVE_CARDS', source: 'aside', destination: 'deck', position: 'TOP', count: 1 }]
                }
            ]
        }
    ],
    set: 'empires',
    expansion: 'empires',
    isSubCard: true
};
