import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Chariot Race (Cost 3) - Action
 * +1 Action. Reveal the top card of your deck. If it costs more than the top card of the player to your left, +1 VP and +1 Coin.
 */
export const chariotRace: CardDefinition = {
    id: 'chariot_race',
    name: 'Course de chars',
    description: "+1 Action. Révélez la carte du dessus de votre deck et comparez-la à celle de votre voisin de gauche. Si la vôtre coûte plus cher, +1 💰 et +1 PV.",
    cost: 3,
    types: ['ACTION'],
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        {
            type: 'REVEAL_TOP_OF_DECK',
            amount: 1,
            next: [
                {
                    type: 'COMPARE_TOP_OF_DECK_WITH_NEIGHBOR',
                    direction: 'LEFT',
                    condition: 'COST_GREATER',
                    onTrue: [
                        { type: 'ADD_VP_TOKENS', amount: 1 },
                        { type: 'ADD_MONEY', amount: 1 }
                    ],
                    onFalse: []
                }
            ]
        }
    ],
    set: 'empires',
    expansion: 'empires'
};
