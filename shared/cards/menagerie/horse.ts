
import { CardDefinition } from '../../types/CardDefinition.js';

export const Horse: CardDefinition = {
    id: 'horse',
    name: 'Cheval',
    types: ['ACTION'],
    cost: 3,
    expansion: 'menagerie',
    set: 'Menagerie',
    description: "+2 Cartes, +1 Action. Remettez cette carte sur sa pile.",
    isNonSupply: true,
    effects: [
        { type: 'DRAW', amount: 2 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'RETURN_TO_PILE' }
    ]
};
