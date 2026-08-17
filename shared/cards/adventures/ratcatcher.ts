import { CardDefinition } from '../../types/CardDefinition.js';

export const ratcatcher: CardDefinition = {
    id: 'ratcatcher',
    name: 'Attrapeur de rats',
    types: ['ACTION', 'RESERVE'],
    cost: 2,
    expansion: 'adventures',
    set: 'adventures',
    description: '+1 Carte, +1 Action. Mettez cette carte sur votre tapis de Réserve. Réserve: Au début de votre tour, appelez cette carte pour écarter une carte de votre main.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'MOVE_TO_TAVERN_MAT' }
    ] as any
};
