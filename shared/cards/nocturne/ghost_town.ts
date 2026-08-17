import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Ghost Town (Cost 3) - Night-Duration
 * At the start of your next turn, +1 Card and +1 Action.
 * (When you gain this, put it into your hand.)
 */
export const ghostTown: CardDefinition = {
    id: 'ghost_town',
    name: 'Ghost Town',
    cost: 3,
    types: ['NIGHT', 'DURATION'],
    onGain: [
        { type: 'MOVE_GAINED_TO_HAND' }
    ],
    durationTurns: 1,
    durationEffects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 }
    ],
    set: 'nocturne',
    expansion: 'nocturne'
};
