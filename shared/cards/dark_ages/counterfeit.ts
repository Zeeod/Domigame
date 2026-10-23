import { CardDefinition } from '../../types/CardDefinition.js';

export const counterfeit: CardDefinition = {
    id: 'counterfeit',
    name: 'Contrefaçon',
    cost: 5,
    types: ['TREASURE'],
    expansion: 'dark_ages',
    treasureValue: 0,
    description: '1 💰, +1 Achat. Vous pouvez jouer deux fois un Trésor non-Durée de votre main. Si vous le faites, écartez ce Trésor.',
    effects: [
        { type: 'ADD_MONEY', amount: 1 },
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'COUNTERFEIT' }
    ] as any
};
