/**
 * Gold - Base Treasure Card
 */
import { CardDefinition } from '../../types/CardDefinition.js';

export const gold: CardDefinition = {
    id: 'gold',
    name: 'Or',
    cost: 6,
    types: ['TREASURE'],
    treasureValue: 3,
    effects: [
        { type: 'ADD_MONEY', amount: 3 }
    ],
    description: '+3 Pièces',

    expansion: 'Base'
};

