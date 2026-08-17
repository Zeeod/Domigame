/**
 * Curse - Base Curse Card
 * -1 VP
 */
import { CardDefinition } from '../../types/CardDefinition.js';

export const curse: CardDefinition = {
    id: 'curse',
    name: 'Malédiction',
    cost: 0,
    types: ['CURSE'],
    effects: [],
    victoryPoints: -1,
    description: '-1 PV',

    expansion: 'Base'
};

