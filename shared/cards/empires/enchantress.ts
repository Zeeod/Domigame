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
    description: 'Jusqu\'à votre prochain tour, la première fois que chaque autre joueur joue une carte Action pendant son tour, il reçoit +1 Carte et +1 Action au lieu de suivre ses instructions. Au début de votre prochain tour : +2 Cartes.',
    cost: 3,
    types: ['ACTION', 'DURATION', 'ATTACK'],
    effects: [
        { type: 'REGISTER_ENCHANTRESS' } as any
    ],
    durationEffects: [
        { type: 'DRAW', amount: 2 }
    ],
    expansion: 'empires'
};
