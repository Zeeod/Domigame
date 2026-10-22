import { CardDefinition } from '../../types/CardDefinition.js';

export const Herbalist: CardDefinition = {
    id: 'herbalist',
    name: 'Herboriste',
    types: ['ACTION'],
    cost: 2,
    expansion: 'alchemy',
    description: '+1 Achat, +1 💰. Quand vous défaussez cette carte du jeu, vous pouvez placer un de vos Trésors en jeu sur votre pioche.',
    effects: [
        {
            type: 'ADD_BUYS',
            amount: 1
        },
        {
            type: 'ADD_MONEY',
            amount: 1
        }
    ],
    onDiscard: [{ type: 'HERBALIST_ON_DISCARD' }] as any
};
