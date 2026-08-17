import { CardDefinition } from '../../types/CardDefinition.js';

export const remake: CardDefinition = {
    id: 'remake',
    name: 'Refonte',
    types: ['ACTION'],
    cost: 4,
    expansion: 'cornucopia',
    set: 'cornucopia',
    description: 'Deux fois: Écartez une carte de votre main, gagnez une carte coûtant exactement 1 💰 de plus.',
    effects: [
        {
            type: 'TRASH',
            min: 1,
            max: 1,
            from: 'hand',
            message: 'Première carte à écarter',
            onSuccess: [{ type: 'GAIN_CARD_EXACT_COST', costBonus: 1 }]
        } as any,
        {
            type: 'TRASH',
            min: 1,
            max: 1,
            from: 'hand',
            message: 'Deuxième carte à écarter',
            onSuccess: [{ type: 'GAIN_CARD_EXACT_COST', costBonus: 1 }]
        } as any
    ]
};
