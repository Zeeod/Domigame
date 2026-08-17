import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Royal Blacksmith (Cost 8 Debt) - Action
 * +5 Cards. Reveal your hand. Discard all Coppers.
 */
export const royalBlacksmith: CardDefinition = {
    id: 'royal_blacksmith',
    name: 'Forgeron Royal',
    description: "+5 Cartes. Révélez votre main. Défaussez tous vos Cuivres.",
    debtCost: 8,
    cost: 0,
    types: ['ACTION'],
    effects: [
        { type: 'DRAW', amount: 5 },
        { type: 'REVEAL_HAND' },
        {
            type: 'DISCARD',
            filter: { cardIds: ['copper'] },
            forceAll: true
        }
    ],
    set: 'empires',
    expansion: 'empires'
};
