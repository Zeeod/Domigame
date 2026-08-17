/**
 * Moat - Base Action-Reaction Card
 * +2 Cards. When another player plays an Attack, reveal this to be unaffected.
 */
import { CardDefinition } from '../../types/CardDefinition.js';

export const moat: CardDefinition = {
    id: 'moat',
    name: 'Douves',
    cost: 2,
    types: ['ACTION', 'REACTION'],
    effects: [
        { type: 'DRAW', amount: 2 }
    ],
    // Reaction effect is handled by EffectEngine when processing attacks
    isReaction: true,
    reactionTrigger: 'ATTACK',
    blocksAttack: true,
    description: "+2 Cartes. Lorsqu'un autre joueur joue une carte Attaque, vous pouvez dévoiler cette carte de votre main. Dans ce cas, l'Attaque n'a pas d'effet sur vous.",
    image: '/card-images/moat.jpg',

    expansion: 'Base'
};
