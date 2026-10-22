import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Crystal Ball - Prosperity 2nd Edition
 * Cost: 5
 * Types: TREASURE
 * Text: 1$. When you play this, look at the top card of your deck. 
 * You may trash it, discard it, or put it into your hand.
 */
export const crystalBall: CardDefinition = {
    id: 'crystal_ball',
    name: 'Boule de cristal',
    cost: 5,
    types: ['TREASURE'],
    expansion: 'prosperity',
    description: '1 💰. Regardez la carte du dessus de votre pioche. Vous pouvez l\'écarter, la défausser, ou, si c\'est une carte Action ou Trésor, la jouer.',
    treasureValue: 1,
    effects: [
        { type: 'ADD_MONEY', amount: 1 },
        { type: 'CRYSTAL_BALL' }
    ] as any
};
