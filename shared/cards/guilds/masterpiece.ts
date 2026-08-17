import { CardDefinition } from '../../types/CardDefinition.js';

export const masterpiece: CardDefinition = {
    id: 'masterpiece',
    name: 'Chef-d\'oeuvre',
    types: ['TREASURE'],
    cost: 3,
    expansion: 'guilds',
    set: 'guilds',
    description: '1 💰. Surprix: Gagnez un Argent par 💰 de surprix.',
    treasureValue: 1,
    effects: [
        { type: 'ADD_MONEY', amount: 1 }
    ]
    // Note: Overpay needs special buy phase handling
};
