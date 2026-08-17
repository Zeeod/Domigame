import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Peddler - Prosperity 2nd Edition
 * Cost: 8* (Dynamic)
 * Types: ACTION
 * Text: +1 Card, +1 Action, +1 Money. 
 * During your turn, this costs 2 less per Action card you have in play, but not less than 0.
 */
export const peddler: CardDefinition = {
    id: 'peddler',
    name: 'Colporteur',
    cost: 8,
    types: ['ACTION'],
    expansion: 'Prosperity',
    set: 'prosperity',
    description: '+1 Carte, +1 Action, +1 💰. Pendant votre tour, cette carte coûte 2 💰 de moins par carte Action que vous avez en jeu (minimum 0).',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_MONEY', amount: 1 }
    ]
};
