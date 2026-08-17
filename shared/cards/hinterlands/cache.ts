import { CardDefinition } from '../../types/CardDefinition.js';

export const cache: CardDefinition = {
    id: 'cache',
    name: 'Réserve',
    types: ['TREASURE'],
    cost: 5,
    expansion: 'hinterlands',
    set: 'hinterlands',
    description: '3 💰. Quand vous gagnez cette carte, gagnez 2 Cuivres.',
    treasureValue: 3,
    effects: [
        { type: 'ADD_MONEY', amount: 3 }
    ],
    onGain: [
        { type: 'GAIN_CARD', cardId: 'copper', destination: 'discardPile' },
        { type: 'GAIN_CARD', cardId: 'copper', destination: 'discardPile' }
    ]
};
