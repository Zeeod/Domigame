/**
 * Sentry - Base Action Card (2nd Edition)
 * +1 Card, +1 Action.
 * Look at the top 2 cards of your deck. Trash and/or discard any number of them. 
 * Put the rest back on top in any order.
 */
import { CardDefinition } from '../../types/CardDefinition.js';

export const sentry: CardDefinition = {
    id: 'sentry',
    name: 'Sentinelle',
    cost: 5,
    types: ['ACTION'],
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'MODIFY_RESOURCE', resource: 'actions', amount: 1 },
        {
            type: 'SEQUENCE',
            effects: [
                { type: 'REVEAL_CARDS', amount: 2, source: 'deck', destination: 'limbo' },
                {
                    type: 'SENTRY_INTERACTION',
                    amount: 2,
                    message: "Sentinelle : Écartez, défaussez et réordonnez"
                }
            ]
        }
    ],
    description: '+1 Carte ; +1 Action. Regardez les 2 cartes du sommet de votre pioche. Écartez et/ou défaussez celles que vous voulez. Replacez les autres sur votre pioche dans l\'ordre de votre choix.',
    image: '/card-images/sentry.jpg',

    expansion: 'Base'
};
