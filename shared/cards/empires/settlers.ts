import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Settlers (Cost 2) - Action
 * +1 Action, +1 Card. You may look through your discard pile and put a Copper from it into your hand.
 */
export const settlers: CardDefinition = {
    id: 'settlers',
    name: 'Colons',
    description: '+1 Carte, +1 Action. Vous pouvez dévoiler un Cuivre de votre défausse et le prendre en main.',
    cost: 2,
    types: ['ACTION'],
    effects: [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 }, { type: 'TAKE_FROM_DISCARD', cardId: 'copper' }] as any,
    expansion: 'empires',
    isSubCard: true
};
