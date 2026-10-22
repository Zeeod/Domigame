import { CardDefinition } from '../../types/CardDefinition.js';

export const haggler: CardDefinition = {
    id: 'haggler',
    name: 'Marchandeur',
    types: ['ACTION'],
    cost: 5,
    expansion: 'hinterlands',
    description: '+2 💰. Ce tour-ci, quand vous recevez une carte que vous avez achetée, recevez une carte non-Victoire moins chère.',
    effects: [
        { type: 'ADD_MONEY', amount: 2 }
    ],
    triggers: [
        {
            trigger: 'ON_BUY',
            effects: [{ type: 'GAIN_CARD', maxCost: 'LAST_BOUGHT_COST' as any, nonVictory: true, destination: 'discardPile', message: 'Marchandeur : recevez une carte non-Victoire moins chère' }]
        }
    ] as any
};
