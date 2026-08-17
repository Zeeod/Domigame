import { CardDefinition } from '../../types/CardDefinition.js';

export const stonemason: CardDefinition = {
    id: 'stonemason',
    name: 'Tailleur de pierre',
    types: ['ACTION'],
    cost: 2,
    expansion: 'guilds',
    set: 'guilds',
    description: 'Écartez une carte de votre main. Gagnez 2 cartes coûtant chacune moins que la carte écartée. Surprix: Gagnez 2 cartes Action coûtant exactement le surprix payé.',
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
    ] as any
};
