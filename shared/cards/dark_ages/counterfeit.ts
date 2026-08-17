import { CardDefinition } from '../../types/CardDefinition.js';

export const counterfeit: CardDefinition = {
    id: 'counterfeit',
    name: 'Contrefaçon',
    cost: 5,
    types: ['TREASURE'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    treasureValue: 1,
    description: '1💰, +1 Achat. Vous pouvez jouer un Trésor non-Contrefaçon de votre main deux fois. Si vous le faites, écartez ce Trésor.',
    effects: [
        { type: 'ADD_MONEY', amount: 1 },
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'PLAY_TREASURE_TWICE_THEN_TRASH', optional: true, filter: { excludeIds: ['counterfeit'] } } as any
    ]
};
