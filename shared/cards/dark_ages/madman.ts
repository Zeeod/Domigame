import { CardDefinition } from '../../types/CardDefinition.js';

export const madman: CardDefinition = {
    id: 'madman',
    name: 'Fou',
    cost: 0,
    types: ['ACTION'],
    expansion: 'dark_ages',
    isSubCard: true,
    description: '+2 Actions. Remettez cette carte sur la pile des Fous. Si vous le faites, +1 Carte par carte dans votre main. (Hors réserve.)',
    effects: [
        { type: 'ADD_ACTIONS', amount: 2 },
        { type: 'RETURN_TO_PILE' },
        { type: 'MADMAN_DRAW' }
    ] as any
};
