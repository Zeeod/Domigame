/**
 * Workshop - Base Action Card
 * Gain a card costing up to 4.
 */
import { CardDefinition } from '../../types/CardDefinition.js';

export const workshop: CardDefinition = {
    id: 'workshop',
    name: 'Atelier',
    cost: 3,
    types: ['ACTION'],
    effects: [
        {
            type: 'GAIN_CARD',
            destination: 'discardPile',
            maxCost: 4
        }
    ],
    description: 'Gagnez une carte coûtant jusqu\'à 4 Pièces.',
    image: '/card-images/workshop.jpg',

    expansion: 'Base'
};


