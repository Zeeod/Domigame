/**
 * Poacher - Base Action Card (2nd Edition)
 * +1 Card, +1 Action, +1 Money.
 * Discard a card per empty Supply pile.
 */
import { CardDefinition } from '../../types/CardDefinition.js';

export const poacher: CardDefinition = {
    id: 'poacher',
    name: 'Braconnier',
    cost: 4,
    types: ['ACTION'],
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_MONEY', amount: 1 },
        { type: 'DISCARD_PER_EMPTY_SUPPLY' }
    ],
    description: '+1 Carte ; +1 Action ; +1 Pièce. Défaussez une carte de votre main par pile de réserve vide.',
    image: '/card-images/poacher.jpg',

    expansion: 'Base'
};


