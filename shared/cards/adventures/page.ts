import { CardDefinition } from '../../types/CardDefinition.js';

export const page: CardDefinition = {
    id: 'page',
    name: 'Page',
    types: ['ACTION', 'TRAVELLER'],
    cost: 2,
    expansion: 'adventures',
    set: 'adventures',
    description: '+1 Carte, +1 Action. Quand vous défaussez du jeu, vous pouvez échanger contre un Chercheur de trésors (depuis la pile).',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 }
    ],
    upgradesTo: 'treasure_hunter'
};
