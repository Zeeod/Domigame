import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Night Watchman (Cost 3) - Night
 * Look at the top 5 cards of your deck. Discard any number of them and put the rest back in any order.
 * (When you gain this, put it into your hand.)
 */
export const nightWatchman: CardDefinition = {
    id: 'night_watchman',
    name: 'Night Watchman',
    cost: 3,
    types: ['NIGHT'],
    onGain: [
        { type: 'MOVE_GAINED_TO_HAND' }
    ],
    effects: [
        {
            type: 'REVEAL_TOP_OF_DECK',
            amount: 5,
            next: [
                {
                    type: 'CHOOSE_FROM_REVEALED',
                    message: 'Choisissez les cartes à défausser',
                    min: 0,
                    max: 5,
                    destination: 'discardPile',
                    next: [{ type: 'REORDER_REMAINING_REVEALED', destination: 'deck' }]
                }
            ]
        }
    ],
    set: 'nocturne',
    expansion: 'nocturne'
};
