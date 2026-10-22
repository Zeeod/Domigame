import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * War Chest - Prosperity 2nd Edition
 * Cost: 5
 * Types: TREASURE
 * Text: 2$. At the start of your Buy phase, if you have at least 1$ in your pool, 
 * you may gain a card costing up to 4$.
 */
export const warChest: CardDefinition = {
    id: 'war_chest',
    name: 'Trésor de guerre',
    cost: 5,
    types: ['TREASURE'],
    expansion: 'prosperity',
    description: 'Le joueur à votre gauche nomme une carte. Recevez une carte coûtant jusqu\'à 5 💰 qui n\'a pas été nommée pour un Trésor de guerre ce tour-ci.',
    treasureValue: 0,
    effects: [
        { type: 'WAR_CHEST' }
    ] as any,
    triggers: []
};
