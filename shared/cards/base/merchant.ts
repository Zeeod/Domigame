/**
 * Merchant - Base Action Card (2nd Edition)
 * +1 Card, +1 Action. 
 * The first time you play a Silver this turn, +1 Money.
 */
import { CardDefinition } from '../../types/CardDefinition.js';

export const merchant: CardDefinition = {
    id: 'merchant',
    name: 'Marchand',
    cost: 3,
    types: ['ACTION'],
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        {
            type: 'CONDITION',
            condition: 'PHASE',
            value: 'ACTION',
            trueEffects: [
                {
                    type: 'REGISTER_TRIGGER',
                    trigger: 'ON_PLAY',
                    filter: { cardIds: ['silver'] },
                    effects: [
                        {
                            type: 'CONDITION',
                            condition: 'FIRST_SILVER_OF_TURN',
                            trueEffects: [{ type: 'ADD_MONEY', amount: 1 }]
                        }
                    ],
                    duration: 'TURN'
                }
            ]
        }
    ],
    description: '+1 Carte ; +1 Action. La première fois que vous jouez un Argent ce tour-ci, vous gagnez +1 Pièce.',
    image: '/card-images/merchant.jpg',

    expansion: 'Base'
};


