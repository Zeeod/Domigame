import { CardDefinition } from '../../types/CardDefinition.js';

export const experiment: CardDefinition = {
    id: 'experiment',
    name: 'Expérience',
    cost: 3,
    types: ['ACTION'],
    effects: [
        { type: 'DRAW', amount: 2 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'RETURN_TO_SUPPLY' }
    ],
    onGain: [
        { type: 'GAIN_CARD', cardId: 'experiment' }
    ],
    description: '+2 Cartes. +1 Action. Retournez cette carte dans la réserve. \nLorsqu\'un joueur reçoit cette carte, il reçoit une autre Expérience.',
    image: '/card-images/experiment.jpg',
    expansion: 'Renaissance',
    set: 'renaissance'
};
