import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Capital (Cost 5) - Treasure
 * +6💰, +1 Buy. 
 * When you discard this from play, pay off as much Debt as you can, then take 6 Debt.
 */
export const capital: CardDefinition = {
    id: 'capital',
    name: 'Capital',
    description: "6 💰. +1 Achat. Lorsque vous défaussez cette carte du jeu, remboursez votre Dette, puis prenez 6 Dettes.",
    cost: 5,
    types: ['TREASURE'],
    treasureValue: 6,
    effects: [
        { type: 'ADD_BUYS', amount: 1 }
    ],
    onDiscard: [
        // This is triggered when discarded from play
        { type: 'PAY_DEBT' },
        { type: 'TAKE_DEBT', amount: 6 }
    ],
    set: 'empires',
    expansion: 'empires'
};
