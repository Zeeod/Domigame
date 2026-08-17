import { CardDefinition } from '../../types/CardDefinition.js';

export const guide: CardDefinition = {
    id: 'guide',
    name: 'Guide',
    types: ['ACTION', 'RESERVE'],
    cost: 3,
    expansion: 'adventures',
    set: 'adventures',
    description: '+1 Carte, +1 Action. Mettez cette carte sur votre tapis de Réserve. Réserve: Au début de votre tour, appelez cette carte pour défausser votre main et piocher 5 cartes.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'MOVE_TO_TAVERN_MAT' }
    ] as any
};
