import { CardDefinition } from '../../types/CardDefinition.js';

export const candlestickMaker: CardDefinition = {
    id: 'candlestick_maker',
    name: 'Cirier',
    types: ['ACTION'],
    cost: 2,
    expansion: 'guilds',
    set: 'guilds',
    description: '+1 Action, +1 Achat, +1 Coffre.',
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'ADD_COFFERS', amount: 1 }
    ] as any
};
