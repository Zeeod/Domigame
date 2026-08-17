import { CardDefinition } from '../../types/CardDefinition.js';

export const treasureTrove: CardDefinition = {
    id: 'treasure_trove',
    name: 'Butin',
    types: ['TREASURE'],
    cost: 5,
    expansion: 'adventures',
    set: 'adventures',
    description: '2 💰. Quand vous jouez cette carte, gagnez un Or et un Cuivre.',
    treasureValue: 2,
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'GAIN_CARD', cardId: 'gold', destination: 'discardPile' },
        { type: 'GAIN_CARD', cardId: 'copper', destination: 'discardPile' }
    ]
};
