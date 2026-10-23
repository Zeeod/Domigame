import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Bustling Village (Cost 5) - Action
 * +3 Actions, +1 Card. You may look through your discard pile and put a Settlers from it into your hand.
 */
export const bustlingVillage: CardDefinition = {
    id: 'bustling_village',
    name: 'Village bouillonnant',
    description: '+1 Carte, +3 Actions. Vous pouvez dévoiler un Colons de votre défausse et le prendre en main.',
    cost: 5,
    types: ['ACTION'],
    effects: [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 3 }, { type: 'TAKE_FROM_DISCARD', cardId: 'settlers' }] as any,
    expansion: 'empires',
    isSubCard: true // It's under Settlers in the pile
};
