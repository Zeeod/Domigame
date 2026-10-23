import { CardDefinition } from '../../types/CardDefinition.js';

export const hero: CardDefinition = {
    id: 'hero',
    name: 'Héros',
    types: ['ACTION', 'TRAVELLER'],
    cost: 5,
    expansion: 'adventures',
    isNonSupply: true,
    description: '+2 💰. Gagnez un Trésor. Quand vous défaussez du jeu, vous pouvez échanger contre un Champion.',
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'GAIN_CARD', maxCost: 99, cardTypes: ['TREASURE'], message: 'Héros : recevez un Trésor' }
    ] as any,
    upgradesTo: 'champion'
};
