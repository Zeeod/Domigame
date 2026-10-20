import { CardDefinition } from '../../types/CardDefinition.js';

export const advisor: CardDefinition = {
    id: 'advisor',
    name: 'Conseiller',
    types: ['ACTION'],
    cost: 4,
    expansion: 'guilds',
    description: '+1 Action. Révélez les 3 cartes du dessus de votre pioche. Le joueur à votre gauche en choisit une à défausser. Prenez les autres en main.',
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        {
            type: 'REVEAL_CARDS',
            amount: 3,
            source: 'deck',
            destination: 'limbo'
        },
        // The player to your left picks one to discard; the rest go to your hand
        { type: 'OPPONENT_CHOOSES_DISCARD', count: 1, restTo: 'hand' }
    ] as any
};
