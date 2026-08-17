import { CardDefinition } from '../../types/CardDefinition.js';

export const wanderingMinstrel: CardDefinition = {
    id: 'wandering_minstrel',
    name: 'Ménestrel Errant',
    cost: 4,
    types: ['ACTION'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: '+1 Carte, +2 Actions. Révélez les 3 cartes du dessus de votre deck. Remettez les Actions dans l\'ordre de votre choix et défaussez le reste.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 2 },
        { type: 'REVEAL_AND_SORT_ACTIONS', amount: 3 } as any
    ]
};
