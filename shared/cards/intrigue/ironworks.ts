import { CardDefinition } from '../../types/CardDefinition.js';

export const ironworks: CardDefinition = {
    id: 'ironworks',
    name: 'Fonderie',
    cost: 4,
    types: ['ACTION'],
    effects: [
        {
            type: 'GAIN_CARD',
            maxCost: 4,
            destination: 'discardPile'
        },
        {
            type: 'CONDITION',
            condition: 'IS_ACTION',
            trueEffects: [{ type: 'ADD_ACTIONS', amount: 1 }]
        },
        {
            type: 'CONDITION',
            condition: 'IS_TREASURE',
            trueEffects: [{ type: 'ADD_MONEY', amount: 1 }]
        },
        {
            type: 'CONDITION',
            condition: 'IS_VICTORY',
            trueEffects: [{ type: 'DRAW', amount: 1 }]
        }
    ],
    description: 'Gagnez une carte coûtant jusqu’à 4 ??. Si c’est une carte Action, +1 Action. Si c’est un Trésor, +1 ??. Si c’est une Victoire, +1 Carte.',
    image: '/card-images/ironworks.jpg',
    expansion: 'Intrigue'
};
