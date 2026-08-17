import { CardDefinition } from '../../types/CardDefinition.js';

export const wheelwright: CardDefinition = {
    id: 'wheelwright',
    name: 'Charron',
    cost: 5,
    types: ['ACTION'],
    description: '+1 Carte; +1 Action. Défaussez une carte. Si vous le faites, gagnez une carte coûtant jusqu\'à 2 💰 de plus que la carte défaussée.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        {
            type: 'DISCARD',
            amount: 1,
            min: 1,
            max: 1,
            onSuccess: [
                {
                    type: 'GAIN_CARD_RELATIVE_TO_DISCARD',
                    costBonus: 2
                }
            ]
        }
    ],
    expansion: 'Hinterlands',
    set: 'hinterlands',
    isLegacy: false
};
