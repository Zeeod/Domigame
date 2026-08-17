import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Enchantress (Cost 3) - Action-Duration-Attack
 * Until your next turn, the first time each other player plays an Action card on their turn, 
 * they get +1 Card and +1 Action instead of what the card says.
 * At the start of your next turn, +2 Cards.
 */
export const enchantress: CardDefinition = {
    id: 'enchantress',
    name: 'Enchanteresse',
    description: "Durant le tour de chaque autre joueur, jusqu'à votre prochain tour, la première fois qu'il joue une Action : +1 Carte et +1 Action au lieu de suivre les instructions de la carte. Au début de votre prochain tour : +2 Cartes.",
    cost: 3,
    types: ['ACTION', 'DURATION', 'ATTACK'],
    effects: [
        { type: 'REGISTER_ENCHANTRESS' } as any
    ],
    durationEffects: [
        { type: 'DRAW', amount: 2 }
    ],
    set: 'empires',
    expansion: 'empires'
};
