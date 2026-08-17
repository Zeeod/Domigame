import { CardDefinition } from '../../types/CardDefinition.js';

export const scavenger: CardDefinition = {
    id: 'scavenger',
    name: 'Charognard',
    cost: 4,
    types: ['ACTION'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: '+2💰. Vous pouvez mettre votre deck dans votre défausse. Mettez une carte de votre défausse sur votre deck.',
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'MAY_DISCARD_DECK' } as any,
        { type: 'TOPDECK_FROM_DISCARD', min: 1, max: 1 } as any
    ]
};
