import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Villa (Cost 4) - Action
 * +2 Actions, +1 Buy, +1 Coin. 
 * When you gain this, put it into your hand and, if it's your Buy Phase, return to your Action Phase.
 */
export const villa: CardDefinition = {
    id: 'villa',
    name: 'Villa',
    description: "+2 Actions. +1 Achat. +1 💰. Lorsque vous recevez cette carte, prenez-la en main, +1 Action, et si c'est votre phase d'Achat, retournez à votre phase d'Action.",
    cost: 4,
    types: ['ACTION'],
    effects: [
        { type: 'ADD_ACTIONS', amount: 2 },
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'ADD_MONEY', amount: 1 }
    ],
    onGain: [
        { type: 'MOVE_CARDS', source: 'discardPile', destination: 'hand', count: 1, filter: { cardIds: ['villa'] } },
        {
            type: 'CONDITION',
            condition: 'PHASE',
            value: 'BUY',
            trueEffects: [
                { type: 'CHANGE_PHASE', phase: 'ACTION' }
            ]
        }
    ],
    set: 'empires',
    expansion: 'empires'
};
