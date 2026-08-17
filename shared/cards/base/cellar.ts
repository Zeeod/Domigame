/**
 * Cellar - Base Action Card  
 * +1 Action. Discard any number of cards, then draw that many.
 */
import { CardDefinition } from '../../types/CardDefinition.js';

export const cellar: CardDefinition = {
    id: 'cellar',
    name: 'Cave',
    cost: 2,
    types: ['ACTION'],
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'DISCARD_THEN_DRAW' }
    ],
    description: '+1 Action. Défaussez autant de cartes que vous voulez. +1 Carte par carte défaussée.',
    image: '/card-images/cellar.jpg',

    expansion: 'Base'
};


