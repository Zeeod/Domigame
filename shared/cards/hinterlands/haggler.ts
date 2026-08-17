import { CardDefinition } from '../../types/CardDefinition.js';

export const haggler: CardDefinition = {
    id: 'haggler',
    name: 'Marchandeur',
    types: ['ACTION'],
    cost: 5,
    expansion: 'hinterlands',
    set: 'hinterlands',
    description: '+2 💰. Tant que cette carte est en jeu, quand vous achetez une carte, gagnez une carte non-Victoire coûtant moins.',
    effects: [
        { type: 'ADD_MONEY', amount: 2 }
    ],
    triggers: [
        {
            trigger: 'ON_BUY',
            filter: { matchLinkedId: false }, // Triggers on any buy
            effects: [
                {
                    type: 'GAIN_CARD',
                    maxCost: 'LAST_BOUGHT_COST' as any,
                    cardTypes: ['ACTION', 'TREASURE'], // Simplified: non-victory can be Action or Treasure
                    destination: 'discardPile'
                }
            ]
        }
    ]
};
