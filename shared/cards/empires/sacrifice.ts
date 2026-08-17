import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Sacrifice (Cost 4) - Action
 * Trash a card from your hand. If it's an Action, +2 Cards and +2 Actions. 
 * If it's a Treasure, +2 Coins. If it's a Victory, +2 VP.
 */
export const sacrifice: CardDefinition = {
    id: 'sacrifice',
    name: 'Sacrifice',
    description: "Écartez une carte de votre main. Si c'est une Action, +2 Cartes, +2 Actions. Si c'est un Trésor, +2 💰. Si c'est une Victoire, +2 PV.",
    cost: 4,
    types: ['ACTION'],
    effects: [
        {
            type: 'TRASH',
            amount: 1,
            next: [
                {
                    type: 'SWITCH_ON_LAST_TRASHED',
                    cases: [
                        { condition: { type: 'HAS_TYPE', cardType: 'ACTION' }, effects: [{ type: 'DRAW', amount: 2 }, { type: 'ADD_ACTIONS', amount: 2 }] },
                        { condition: { type: 'HAS_TYPE', cardType: 'TREASURE' }, effects: [{ type: 'ADD_MONEY', amount: 2 }] },
                        { condition: { type: 'HAS_TYPE', cardType: 'VICTORY' }, effects: [{ type: 'ADD_VP_TOKENS', amount: 2 }] }
                    ]
                }
            ]
        }
    ],
    set: 'empires',
    expansion: 'empires'
};
