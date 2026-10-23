import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Capital (Cost 5) - Treasure
 * +6💰, +1 Buy. 
 * When you discard this from play, pay off as much Debt as you can, then take 6 Debt.
 */
export const capital: CardDefinition = {
    id: 'capital',
    name: 'Capital',
    description: '6 💰, +1 Achat. Quand vous défaussez cette carte du jeu, prenez 6 Dette, puis vous pouvez rembourser de la Dette.',
    cost: 5,
    types: ['TREASURE'],
    treasureValue: 0,
    effects: [{ type: 'ADD_MONEY', amount: 6 }, { type: 'ADD_BUYS', amount: 1 }] as any,
    onDiscard: [{ type: 'CAPITAL_DEBT' }] as any,
    expansion: 'empires'
};
