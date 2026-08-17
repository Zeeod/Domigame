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
    expansion: 'Prosperity',
    set: 'prosperity',
    description: 'Vaut 2 💰. Au début de votre phase d\'Achat, si vous avez au moins 1 💰, vous pouvez gagner une carte coûtant jusqu\'à 4 💰.',
    treasureValue: 2,
    effects: [
        { type: 'ADD_MONEY', amount: 2 }
    ],
    triggers: [
        {
            trigger: 'START_BUY_PHASE',
            effects: [
                {
                    type: 'CHOOSE_FROM_ZONE',
                    sourceZone: 'supply',
                    destination: 'discardPile',
                    min: 0,
                    max: 1,
                    filter: { maxCost: 4 },
                    message: 'Voulez-vous gagner une carte via Coffre de Guerre ?',
                    optional: true
                }
            ]
        }
    ]
};
