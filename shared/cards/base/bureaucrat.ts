/**
 * Bureaucrat - Base Action-Attack Card
 * Gain a Silver to the top of your deck.
 * Each other player reveals a Victory card and puts it on their deck (or reveals hand with no Victory).
 */
import { CardDefinition } from '../../types/CardDefinition.js';

export const bureaucrat: CardDefinition = {
    id: 'bureaucrat',
    name: 'Bureaucrate',
    cost: 4,
    types: ['ACTION', 'ATTACK'],
    effects: [
        { type: 'GAIN_CARD', cardId: 'silver', destination: 'deck' },
        {
            type: 'ATTACK',
            attackEffects: [
                {
                    type: 'CHOOSE_FROM_ZONE',
                    sourceZone: 'hand',
                    destination: 'deck',
                    min: 1,
                    max: 1,
                    filter: { cardTypes: ['VICTORY'] },
                    message: 'Dévoilez une carte Victoire',
                    onNoMatch: { type: 'REVEAL_CARDS', amount: 99, source: 'hand' }
                }
            ]
        }
    ],
    description: 'Gagnez une carte Argent et placez-la sur votre pioche. Chaque autre joueur dévoile une carte Victoire de sa main et la place sur sa pioche (ou dévoile une main sans carte Victoire).',
    image: '/card-images/bureaucrat.jpg',

    expansion: 'Base'
};
