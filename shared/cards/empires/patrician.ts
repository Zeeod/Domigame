import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Patrician (Cost 2) - Action
 * +1 Card, +1 Action.
 * Reveal the top card of your deck; if it costs 5💰 or more, put it into your hand.
 */
export const patrician: CardDefinition = {
    id: 'patrician',
    name: 'Patricien',
    description: "+1 Carte. +1 Action. Révélez la carte du dessus de votre deck. Si elle coûte 5 💰 ou plus, prenez-la en main.",
    cost: 2,
    types: ['ACTION'],
    effects: [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 }, { type: 'PATRICIAN' }] as any,
    expansion: 'empires',
    isSubCard: true
};
