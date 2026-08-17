/**
 * Bandit - Base Action Card (2nd Edition)
 * Gain a Gold. Each other player reveals the top 2 cards of their deck, 
 * trashes a revealed Treasure other than Copper, and discards the rest.
 */
import { CardDefinition } from '../../types/CardDefinition.js';

export const bandit: CardDefinition = {
    id: 'bandit',
    name: 'Bandit',
    cost: 5,
    types: ['ACTION', 'ATTACK'],
    effects: [
        { type: 'GAIN_CARD', cardId: 'gold', destination: 'discardPile' },
        {
            type: 'ATTACK',
            attackEffects: [
                { type: 'REVEAL_CARDS', amount: 2, source: 'deck', destination: 'limbo' },
                {
                    type: 'CHOOSE_FROM_ZONE',
                    sourceZone: 'limbo',
                    destination: 'trash',
                    min: 1,
                    max: 1,
                    message: 'Écartez un trésor (autre que Cuivre)',
                    filter: { cardTypes: ['TREASURE'], excludeIds: ['copper'] }
                },
                { type: 'MOVE_CARDS', source: 'limbo', destination: 'discardPile' }
            ]
        }
    ],
    description: 'Gagnez un Or. Chaque autre joueur dévoile les deux cartes du sommet de sa pioche, écarte une carte Trésor dévoilée autre qu\'un Cuivre et défausse le reste.',
    image: '/card-images/bandit.jpg',

    expansion: 'Base'
};
