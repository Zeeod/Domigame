import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Groundskeeper (Cost 5) - Action
 * +1 Action, +1 Card. While this is in play, when you gain a Victory card, +1 VP.
 */
export const groundskeeper: CardDefinition = {
    id: 'groundskeeper',
    name: 'Gardien',
    description: "+1 Carte. +1 Action. Tant que cette carte est en jeu, lorsque vous recevez une carte Victoire, +1 PV.",
    cost: 5,
    types: ['ACTION'],
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 }
    ],
    triggers: [
        {
            trigger: 'ON_GAIN',
            filter: { cardTypes: ['VICTORY'] },
            effects: [{ type: 'ADD_VP_TOKENS', amount: 1 }]
        }
    ],
    set: 'empires',
    expansion: 'empires'
};
