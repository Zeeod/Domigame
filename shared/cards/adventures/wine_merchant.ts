import { CardDefinition } from '../../types/CardDefinition.js';

export const wineMerchant: CardDefinition = {
    id: 'wine_merchant',
    name: 'Marchand de vin',
    types: ['ACTION', 'RESERVE'],
    cost: 5,
    expansion: 'adventures',
    description: '+1 Achat, +4 💰. Placez cette carte sur votre plateau Taverne. À la fin de votre phase Achat, si vous avez au moins 2 💰 non dépensés, vous pouvez la défausser de votre plateau Taverne.',
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'ADD_MONEY', amount: 4 },
        { type: 'MOVE_TO_TAVERN_MAT' }
    ] as any,
    triggers: [{ trigger: 'ON_CLEANUP', call: true, callTo: 'discard', filter: { minCoins: 2 }, effects: [] }] as any
};
