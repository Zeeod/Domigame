import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Anvil - Prosperity 2nd Edition
 * Cost: 3
 * Types: ACTION
 * Text: +1 Action. Discard a Treasure to gain a card costing up to 4.
 */
export const anvil: CardDefinition = {
    id: 'anvil',
    name: 'Enclume',
    cost: 3,
    types: ['ACTION'],
    expansion: 'Prosperity',
    set: 'prosperity',
    description: '+1 Action. Vous pouvez défausser un Trésor pour gagner une carte coûtant jusqu\'à 4.',
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        {
            type: 'DISCARD',
            min: 0,
            max: 1,
            filter: { cardTypes: ['TREASURE'] },
            onSuccess: [
                {
                    type: 'GAIN_CARD',
                    destination: 'discardPile',
                    maxCost: 4
                }
            ]
        }
    ]
};
