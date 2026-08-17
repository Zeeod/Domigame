import { CardDefinition } from '../../types/CardDefinition.js';

export const junkDealer: CardDefinition = {
    id: 'junk_dealer',
    name: 'Brocanteur',
    cost: 5,
    types: ['ACTION'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: '+1 Carte, +1 Action, +1💰. Écartez une carte de votre main.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_MONEY', amount: 1 },
        { type: 'TRASH', min: 1, max: 1, from: 'hand' }
    ]
};
