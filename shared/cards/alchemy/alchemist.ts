import { CardDefinition } from '../../types/CardDefinition.js';

export const Alchemist: CardDefinition = {
    id: 'alchemist',
    name: 'Alchimiste',
    types: ['ACTION'],
    cost: 3,
    potionCost: 1,
    expansion: 'alchemy',
    description: '+2 Cartes, +1 Action. Quand vous défaussez cette carte du jeu, si vous avez une Potion en jeu, vous pouvez placer cette carte sur votre pioche.',
    effects: [
        {
            type: 'DRAW',
            amount: 2
        },
        {
            type: 'ADD_ACTIONS',
            amount: 1
        }
    ],
    onDiscard: [{ type: 'ALCHEMIST_ON_DISCARD' }] as any
};
