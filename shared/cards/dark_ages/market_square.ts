import { CardDefinition } from '../../types/CardDefinition.js';

export const marketSquare: CardDefinition = {
    id: 'market_square',
    name: 'Place du Marché',
    cost: 3,
    types: ['ACTION', 'REACTION'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: '+1 Carte, +1 Action, +1 Achat. Quand une de vos cartes est écartée, vous pouvez défausser cette carte pour gagner un Or.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_BUYS', amount: 1 }
    ],
    onTrash: [
        { type: 'GAIN_CARD', cardId: 'gold', destination: 'discardPile' }
    ]
};
