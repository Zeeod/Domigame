import { CardDefinition } from '../../types/CardDefinition.js';

export const advisor: CardDefinition = {
    id: 'advisor',
    name: 'Conseiller',
    types: ['ACTION'],
    cost: 4,
    expansion: 'guilds',
    set: 'guilds',
    description: '+1 Action. Révélez les 3 cartes du dessus de votre pioche. Le joueur à votre gauche en choisit une à défausser. Prenez les autres en main.',
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        {
            type: 'REVEAL_CARDS',
            amount: 3,
            source: 'deck',
            destination: 'aside'
        },
        { type: 'OPPONENT_CHOOSES_DISCARD', count: 1 },
        { type: 'MOVE_REMAINING_TO_HAND' }
    ] as any
};
