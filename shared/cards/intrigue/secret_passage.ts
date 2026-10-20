import { CardDefinition } from '../../types/CardDefinition.js';

export const secret_passage: CardDefinition = {
    id: 'secret_passage',
    name: 'Passage secret',
    cost: 4,
    types: ['ACTION'],
    effects: [
        { type: 'DRAW', amount: 2 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'INSERT_INTO_DECK', message: 'Choisissez une carte de votre main à placer dans votre pioche' } as any
    ],
    description: '+2 Cartes, +1 Action. Choisissez une carte de votre main et placez-la où vous voulez dans votre deck.',
    image: '/card-images/secret_passage.jpg',
    expansion: 'intrigue'
};
