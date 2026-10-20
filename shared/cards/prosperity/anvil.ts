import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Anvil (Enclume) — Prosperity 2nd Edition
 * Cost 3 — Treasure
 * $1. You may discard a Treasure to gain a card costing up to $4.
 */
export const anvil: CardDefinition = {
    id: 'anvil',
    name: 'Enclume',
    cost: 3,
    types: ['TREASURE'],
    expansion: 'prosperity',
    description: '+1 💰. Vous pouvez défausser un Trésor pour recevoir une carte coûtant jusqu\'à 4 💰.',
    effects: [
        { type: 'ADD_MONEY', amount: 1 },
        {
            type: 'DISCARD',
            min: 0,
            max: 1,
            filter: { cardTypes: ['TREASURE'] },
            message: 'Enclume : vous pouvez défausser un Trésor pour recevoir une carte coûtant jusqu\'à 4 💰.',
            onSuccess: [
                { type: 'GAIN_CARD', destination: 'discardPile', maxCost: 4 }
            ]
        } as any
    ]
};
