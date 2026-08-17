import { CardDefinition } from '../../types/CardDefinition.js';

export const SilkMerchant: CardDefinition = {
    id: 'silk_merchant',
    name: 'Marchand de Soie',
    types: ['ACTION'],
    cost: 4,
    description: "+2 Cartes. +2 Villageois.\nLorsque vous recevez ou écartez cette carte, +1 Coffre et +1 Villageois.",
    effects: [
        {
            type: 'DRAW',
            amount: 2
        },
        {
            type: 'ADD_BUYS',
            amount: 1
        }
    ],
    onGain: [
        {
            type: 'ADD_COFFERS',
            amount: 1
        },
        {
            type: 'ADD_VILLAGERS',
            amount: 1
        } as any
    ],
    onTrash: [
        {
            type: 'ADD_COFFERS',
            amount: 1
        },
        {
            type: 'ADD_VILLAGERS',
            amount: 1
        } as any
    ],
    expansion: 'Renaissance',
    set: 'renaissance'
};
