import { CardDefinition } from '../../types/CardDefinition.js';

export const stonemason: CardDefinition = {
    id: 'stonemason',
    name: 'Tailleur de pierre',
    types: ['ACTION'],
    cost: 2,
    expansion: 'guilds',
    description: 'Écartez une carte de votre main. Recevez 2 cartes coûtant chacune moins qu\'elle. Surpaiement : recevez 2 cartes Action coûtant chacune le montant surpayé.',
    effects: [
        {
            type: 'TRASH',
            min: 1,
            max: 1,
            from: 'hand',
            message: 'Choisissez une carte à écarter',
            onSuccess: [
                { type: 'GAIN_CARD', maxCost: 'TRASHED_COST_MINUS_1', destination: 'discardPile' },
                { type: 'GAIN_CARD', maxCost: 'TRASHED_COST_MINUS_1', destination: 'discardPile' }
            ]
        }
    ] as any,
    overpayEffects: [{ type: 'STONEMASON_OVERPAY' }] as any
};
