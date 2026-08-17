/**
 * Chapel - Base Action Card
 * Trash up to 4 cards from your hand.
 */
import { CardDefinition } from '../../types/CardDefinition.js';

export const chapel: CardDefinition = {
    id: 'chapel',
    name: 'Chapelle',
    cost: 2,
    types: ['ACTION'],
    effects: [
        { type: 'TRASH', min: 0, max: 4, from: 'hand' }
    ],
    description: 'Écartez jusqu’à 4 cartes de votre main.',
    image: '/card-images/chapel.jpg',

    expansion: 'Base'
};


