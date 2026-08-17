import { CardDefinition } from '../../types/CardDefinition.js';

export const secret_passage: CardDefinition = {
    id: 'secret_passage',
    name: 'Passage secret',
    cost: 4,
    types: ['ACTION'],
    effects: [
        { type: 'DRAW', amount: 2 },
        { type: 'ADD_ACTIONS', amount: 1 },
        {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'hand',
            min: 1, max: 1,
            message: 'Choisissez une carte à mettre dans votre deck',
            context: { specialAction: 'SECRET_PASSAGE_PICK' }
        }
    ],
    description: '+2 Cartes, +1 Action. Choisissez une carte de votre main et placez-la où vous voulez dans votre deck.',
    image: '/card-images/secret_passage.jpg',
    expansion: 'Intrigue'
};
