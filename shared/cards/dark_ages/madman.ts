import { CardDefinition } from '../../types/CardDefinition.js';

export const madman: CardDefinition = {
    id: 'madman',
    name: 'Fou',
    cost: 0,
    types: ['ACTION'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    isSubCard: true,
    description: '+2 Actions. Renvoyez cette carte sur sa pile. Si vous le faites, +1 Carte par carte en main.',
    effects: [
        { type: 'ADD_ACTIONS', amount: 2 },
        { type: 'RETURN_TO_SUPPLY' },
        { type: 'DRAW_PER_CARD_IN_HAND' } as any
    ]
};
