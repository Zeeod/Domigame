import { CardDefinition } from '../../types/CardDefinition.js';

export const Apprentice: CardDefinition = {
    id: 'apprentice',
    name: 'Apprenti',
    types: ['ACTION'],
    cost: 5,
    expansion: 'alchemy',
    set: 'Alchemy',
    description: "+1 Action.\nÉcartez une carte de votre main.\n+1 Carte par pièce que la carte écartée coûte.\n+1 Action par Potion que la carte écartée coûte.",
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
