import { CardDefinition } from '../../types/CardDefinition.js';

export const borderVillage: CardDefinition = {
    id: 'border_village',
    name: 'Village frontalier',
    types: ['ACTION'],
    cost: 6,
    expansion: 'hinterlands',
    set: 'hinterlands',
    description: '+1 Carte, +2 Actions. Quand vous gagnez cette carte, gagnez une carte coûtant moins.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 2 }
    ],
    onGain: [
        { type: 'GAIN_CARD', maxCost: 5, destination: 'discardPile' }
    ]
};
