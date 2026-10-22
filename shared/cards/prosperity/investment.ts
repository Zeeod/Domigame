import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Investment - Prosperity 2nd Edition
 * Cost: 5
 * Types: TREASURE
 * Text: 1$. When you play this, trash a card from your hand. 
 * If you do, +1$ for each uniquely named card in the trash.
 */
export const investment: CardDefinition = {
    id: 'investment',
    name: 'Investissement',
    cost: 5,
    types: ['TREASURE'],
    expansion: 'prosperity',
    description: 'Écartez une carte de votre main. Choisissez : +1 💰 ; ou écartez cette carte pour dévoiler votre main et recevoir +1 🛡️ par Trésor de nom différent qui s\'y trouve.',
    treasureValue: 0,
    effects: [
        { type: 'INVESTMENT' }
    ] as any
};
