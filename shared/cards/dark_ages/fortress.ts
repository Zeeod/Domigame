import { CardDefinition } from '../../types/CardDefinition.js';

export const fortress: CardDefinition = {
    id: 'fortress',
    name: 'Forteresse',
    cost: 4,
    types: ['ACTION'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: '+1 Carte, +2 Actions. Quand vous écartez cette carte, prenez-la en main.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 2 }
    ],
    onTrash: [
        {
            type: 'MOVE_CARDS',
            source: 'trash',
            destination: 'hand',
            count: 1,
            filter: { cardIds: ['fortress'] }
        }
    ]
};
