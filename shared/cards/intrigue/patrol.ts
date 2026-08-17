import { CardDefinition } from '../../types/CardDefinition.js';

export const patrol: CardDefinition = {
    id: 'patrol',
    name: 'Patrouille',
    cost: 5,
    types: ['ACTION'],
    effects: [
        { type: 'MODIFY_RESOURCE', resource: 'actions', amount: 0 }, // Just to ensure it's treated as data-driven if needed, but DRAW is fine
        { type: 'DRAW', amount: 3 },
        {
            type: 'REVEAL_CARDS',
            amount: 4,
            filter: { cardTypes: ['VICTORY', 'CURSE'] },
            destination: 'hand'
        },
        {
            type: 'MOVE_CARDS',
            source: 'limbo',
            destination: 'aside',
            count: 'ALL'
        },
        {
            type: 'REORDER',
            sourceZone: 'aside',
            destination: 'deck',
            position: 'TOP',
            message: "Patrouille : Choisissez l'ordre des cartes restantes sur votre pioche"
        }
    ],
    description: '+3 Cartes. Révélez les 4 cartes du dessus de votre deck. Mettez toutes les cartes Victoire et Malédiction révélées dans votre main. Remettez les autres sur votre deck dans l’ordre de votre choix.',
    image: '/card-images/patrol.jpg',
    expansion: 'Intrigue'
};
