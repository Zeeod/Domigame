/**
 * Copper - Base Treasure Card
 */
import { CardDefinition } from '../../types/CardDefinition.js';

export const copper: CardDefinition = {
    id: 'copper',
    name: 'Cuivre',
    cost: 0,
    types: ['TREASURE'],
    treasureValue: 1,
    effects: [
        { type: 'ADD_MONEY', amount: 1 }
    ],
    description: '+1 Pièce',
    expansion: 'Base'
};
