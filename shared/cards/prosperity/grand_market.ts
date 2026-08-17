import { CardDefinition } from '../../types/CardDefinition.js';

export const grandMarket: CardDefinition = {
    id: 'grand_market',
    name: 'Grand Marché',
    cost: 6,
    types: ['ACTION'],
    description: '+1 Carte; +1 Action; +1 Achat; +2 💰. Vous ne pouvez pas acheter cette carte si vous avez des Cuivres en jeu.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'ADD_MONEY', amount: 2 }
    ],
    buyRestriction: {
        type: 'NO_COPPER_IN_PLAY'
    },
    expansion: 'Prosperity',
    set: 'prosperity'
};
