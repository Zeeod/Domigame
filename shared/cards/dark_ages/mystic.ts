import { CardDefinition } from '../../types/CardDefinition.js';

export const mystic: CardDefinition = {
    id: 'mystic',
    name: 'Mystique',
    cost: 5,
    types: ['ACTION'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: '+1 Action, +2💰. Nommez une carte, puis révélez la carte du dessus de votre deck. Si c\'est la carte nommée, prenez-la en main.',
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'NAME_AND_REVEAL_TOP' } as any
    ]
};
