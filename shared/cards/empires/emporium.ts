import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Emporium (Cost 5) - Action
 * +1 Card, +1 Action, +1💰.
 * When you gain this, if you have 5 or more Action cards in play, +2 VP.
 */
export const emporium: CardDefinition = {
    id: 'emporium',
    name: 'Marché municipal',
    description: "+1 Carte. +1 Action. 1 💰. Lorsque vous recevez cette carte, si vous avez au moins 5 Action en jeu, +2 PV.",
    cost: 5,
    types: ['ACTION'],
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_MONEY', amount: 1 }
    ],
    onGain: [{ type: 'EMPORIUM_ON_GAIN' }] as any,
    expansion: 'empires',
    isSubCard: true
};
