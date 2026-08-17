/**
 * Silver - Base Treasure Card
 */
import { CardDefinition } from '../../types/CardDefinition.js';

export const silver: CardDefinition = {
    id: 'silver',
    name: 'Argent',
    cost: 3,
    types: ['TREASURE'],
    treasureValue: 2,
    effects: [
        { type: 'ADD_MONEY', amount: 2 }
    ],
    description: '+2 Pièces',

    expansion: 'Base'
};

