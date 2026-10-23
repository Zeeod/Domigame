import { CardDefinition } from '../../types/CardDefinition.js';

export const remake: CardDefinition = {
    id: 'remake',
    name: 'Refonte',
    types: ['ACTION'],
    cost: 4,
    expansion: 'cornucopia',
    description: 'Faites ceci deux fois : écartez une carte de votre main, puis recevez une carte coûtant exactement 1 💰 de plus.',
    effects: [
        { type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Refonte : écartez une carte (1/2)', onSuccess: [{ type: 'GAIN_CARD_PLUS_COST', costBonus: 1, exact: true }] },
        { type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Refonte : écartez une carte (2/2)', onSuccess: [{ type: 'GAIN_CARD_PLUS_COST', costBonus: 1, exact: true }] }
    ] as any
};
