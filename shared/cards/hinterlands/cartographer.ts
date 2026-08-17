import { CardDefinition } from '../../types/CardDefinition.js';

export const cartographer: CardDefinition = {
    id: 'cartographer',
    name: 'Cartographe',
    types: ['ACTION'],
    cost: 5,
    expansion: 'hinterlands',
    set: 'hinterlands',
    description: '+1 Carte, +1 Action. Regardez les 4 cartes du dessus de votre pioche. Défaussez-en autant que vous voulez et remettez le reste sur votre pioche dans l\'ordre de votre choix.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        {
            type: 'REVEAL_CARDS',
            amount: 4,
            source: 'deck',
            destination: 'aside'
        },
        {
            type: 'SELECT_AND_APPLY',
            sourceZone: 'aside',
            min: 0,
            max: 4,
            message: 'Défaussez des cartes (les autres seront remises sur votre pioche)',
            action: 'DISCARD'
        },
        {
            type: 'MOVE_CARDS',
            source: 'aside',
            destination: 'deck',
            count: 'all'
        }
    ] as any
};
