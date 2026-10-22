import { CardDefinition } from '../../types/CardDefinition.js';

export const cartographer: CardDefinition = {
    id: 'cartographer',
    name: 'Cartographe',
    types: ['ACTION'],
    cost: 5,
    expansion: 'hinterlands',
    description: '+1 Carte, +1 Action. Regardez les 4 cartes du dessus de votre pioche. Défaussez-en autant que vous voulez et remettez le reste sur votre pioche dans l\'ordre de votre choix.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'REVEAL_CARDS', amount: 4, source: 'deck', destination: 'limbo', private: true },
        { type: 'SELECT_AND_APPLY', sourceZone: 'limbo', min: 0, max: 4, message: 'Cartographe : défaussez autant de ces cartes que vous voulez', action: 'DISCARD' },
        { type: 'REORDER', sourceZone: 'limbo', destination: 'deck', position: 'TOP', message: 'Cartographe : remettez les autres sur votre pioche dans l\'ordre de votre choix' }
    ] as any
};
