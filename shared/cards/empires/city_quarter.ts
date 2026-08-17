import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * City Quarter (Cost 8 Debt) - Action
 * +2 Actions. Draw 1 card per Action card you have in play.
 */
export const cityQuarter: CardDefinition = {
    id: 'city_quarter',
    name: 'Quartier de la Cité',
    description: "+2 Actions. Révélez votre main. +1 Carte par carte Action révélée.",
    debtCost: 8,
    cost: 0,
    types: ['ACTION'],
    effects: [
        { type: 'ADD_ACTIONS', amount: 2 },
        { type: 'ADD_CARDS_PER_ACTION_IN_PLAY', multiplier: 1 }
    ],
    set: 'empires',
    expansion: 'empires'
};
