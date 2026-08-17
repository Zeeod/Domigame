import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Engineer (Cost 4 Debt) - Action
 * Gain a card costing up to 4💰. You may trash this to gain a card costing up to 4💰.
 */
export const engineer: CardDefinition = {
    id: 'engineer',
    name: 'Ingénieur',
    description: "Recevez une carte coûtant jusqu'à 4 💰. Vous pouvez écarter l'Ingénieur. Si vous le faites, recevez une carte coûtant jusqu'à 4 💰.",
    debtCost: 4,
    cost: 0,
    types: ['ACTION'],
    effects: [
        {
            type: 'GAIN_CARD',
            maxCost: 4,
            onSuccess: [
                {
                    type: 'CHOOSE_OPTION',
                    message: 'Voulez-vous écarter l\'Ingénieur pour gagner une autre carte coûtant jusqu\'à 4💰 ?',
                    options: [
                        {
                            label: 'Écarter et gagner',
                            effects: [
                                { type: 'TRASH_SELF' },
                                { type: 'GAIN_CARD', maxCost: 4 }
                            ]
                        },
                        {
                            label: 'Ne pas écarter',
                            effects: []
                        }
                    ]
                }
            ]
        }
    ],
    set: 'empires',
    expansion: 'empires'
};
