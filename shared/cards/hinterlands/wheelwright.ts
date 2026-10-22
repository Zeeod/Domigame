import { CardDefinition } from '../../types/CardDefinition.js';

export const wheelwright: CardDefinition = {
    id: 'wheelwright',
    name: 'Charron',
    cost: 5,
    types: ['ACTION'],
    description: '+1 Carte, +1 Action. Vous pouvez défausser une carte pour recevoir une carte Action coûtant autant ou moins qu\'elle.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'DISCARD', min: 0, max: 1, message: 'Charron : vous pouvez défausser une carte', onSuccess: [{ type: 'WHEELWRIGHT_GAIN' }] }
    ] as any,
    expansion: 'hinterlands',
    isLegacy: false
};
