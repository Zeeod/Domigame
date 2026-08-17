import { CardDefinition } from '../../types/CardDefinition.js';

export const treasureHunter: CardDefinition = {
    id: 'treasure_hunter',
    name: 'Chercheur de trésors',
    types: ['ACTION', 'TRAVELLER'],
    cost: 3,
    expansion: 'adventures',
    set: 'adventures',
    isNonSupply: true,
    description: '+1 Action, +1 💰. Gagnez un Argent par carte qui a été gagnée au tour précédent. Quand vous défaussez du jeu, vous pouvez échanger contre un Guerrier.',
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_MONEY', amount: 1 },
        { type: 'GAIN_SILVER_PER_CARDS_GAINED_LAST_TURN' }
    ] as any,
    upgradesTo: 'warrior'
};
