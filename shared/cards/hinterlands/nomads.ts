import { CardDefinition } from '../../types/CardDefinition.js';

export const nomads: CardDefinition = {
    id: 'nomads',
    name: 'Nomades',
    cost: 4,
    types: ['ACTION'],
    description: '+1 Achat, +2 💰. Quand vous recevez ou écartez cette carte, +2 💰.',
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'ADD_MONEY', amount: 2 }
    ] as any,
    onTrash: [
        { type: 'ADD_MONEY', amount: 2 }
    ],
    expansion: 'hinterlands',
    isLegacy: false,
    onGain: [{ type: 'ADD_MONEY', amount: 2 }] as any
};
