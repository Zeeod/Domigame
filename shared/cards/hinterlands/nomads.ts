import { CardDefinition } from '../../types/CardDefinition.js';

export const nomads: CardDefinition = {
    id: 'nomads',
    name: 'Nomades',
    cost: 4,
    types: ['ACTION'],
    description: '+2 💰. \nLors de l\'achat: +2 Achats. \nLorsque vous écartez cette carte: +2 💰. \nLorsque vous défaussez cette carte pendant un tour: gagnez-la.',
    effects: [
        { type: 'ADD_MONEY', amount: 2 }
    ],
    onBuy: [
        { type: 'ADD_BUYS', amount: 2 }
    ],
    onTrash: [
        { type: 'ADD_MONEY', amount: 2 }
    ],
    onDiscard: [
        { type: 'GAIN_THIS_CARD' } // Requires Generic "ON_DISCARD" trigger support
    ],
    expansion: 'Hinterlands',
    set: 'hinterlands',
    isLegacy: false
};
