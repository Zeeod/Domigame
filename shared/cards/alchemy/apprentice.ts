import { CardDefinition } from '../../types/CardDefinition.js';

export const Apprentice: CardDefinition = {
    id: 'apprentice',
    name: 'Apprenti',
    types: ['ACTION'],
    cost: 5,
    expansion: 'alchemy',
    description: '+1 Action. Écartez une carte de votre main. +1 Carte par 💰 de son coût. +2 Cartes s\'il y a une Potion dans son coût.',
    effects: [
        {
            type: 'ADD_ACTIONS',
            amount: 1
        },
        {
            type: 'TRASH',
            source: 'hand',
            min: 1,
            max: 1,
            message: 'Écartez une carte',
            next: [
                {
                    type: 'GAIN_STATS_BY_COST',
                    resource: 'cards',
                    stats: {
                        moneyMultiplier: 1,
                        potionMultiplier: 2
                    }
                }
            ]
        }
    ]
};
