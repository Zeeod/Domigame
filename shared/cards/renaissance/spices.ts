import { CardDefinition } from '../../types/CardDefinition.js';

export const Spices: CardDefinition = {
    id: 'spices',
    name: 'Épices',
    types: ['TREASURE'],
    cost: 5,
    description: "2 💰. +1 Achat.\nLorsque vous recevez cette carte, +2 Coffres.",
    moneyValue: 2,
    effects: [
        {
            type: 'ADD_BUYS',
            amount: 1
        }
    ],
    onGain: [
        {
            type: 'ADD_COFFERS',
            amount: 2
        } as any
    ],
    expansion: 'Renaissance',
    set: 'renaissance'
};
