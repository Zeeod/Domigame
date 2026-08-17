import { CardDefinition } from '../../types/CardDefinition.js';

export const port: CardDefinition = {
    id: 'port',
    name: 'Port',
    types: ['ACTION'],
    cost: 4,
    expansion: 'adventures',
    set: 'adventures',
    description: '+1 Carte, +2 Actions. Quand vous achetez cette carte, gagnez un autre Port.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 2 }
    ],
    onBuy: [
        { type: 'GAIN_CARD', cardId: 'port', destination: 'discardPile' }
    ]
};
