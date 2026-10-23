import { CardDefinition } from '../../types/CardDefinition.js';

export const scavenger: CardDefinition = {
    id: 'scavenger',
    name: 'Charognard',
    cost: 4,
    types: ['ACTION'],
    expansion: 'dark_ages',
    description: '+2 💰. Vous pouvez placer votre pioche dans votre défausse. Regardez votre défausse et placez-en une carte sur votre pioche.',
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'MAY_DISCARD_DECK' } as any,
        { type: 'TOPDECK_FROM_DISCARD', min: 1, max: 1 } as any
    ]
};
