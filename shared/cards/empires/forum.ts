import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Forum (Cost 5) - Action
 * +3 Cards, +1 Action. Discard 2 cards.
 * When you buy this, +1 Buy.
 */
export const forum: CardDefinition = {
    id: 'forum',
    name: 'Forum',
    description: "+3 Cartes. +1 Action. Défaussez 2 cartes. Lorsque vous achetez cette carte, +1 Achat.",
    cost: 5,
    types: ['ACTION'],
    effects: [
        { type: 'DRAW', amount: 3 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'DISCARD', amount: 2 }
    ],
    onBuy: [
        { type: 'ADD_BUYS', amount: 1 }
    ],
    set: 'empires',
    expansion: 'empires'
};
