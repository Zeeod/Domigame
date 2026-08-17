/**
 * Duchy - Base Victory Card
 */
import { CardDefinition } from '../../types/CardDefinition.js';

export const duchy: CardDefinition = {
    id: 'duchy',
    name: 'Duché',
    cost: 5,
    types: ['VICTORY'],
    victoryPoints: 3,
    description: '3 PV',

    expansion: 'Base'
};

