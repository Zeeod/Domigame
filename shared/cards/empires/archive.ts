import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Archive (Cost 5) - Action-Duration
 * +1 Action. Draw 3 cards. Set them aside face down.
 * At the start of your next 3 turns, put one of them into your hand.
 * (Note: Total 3 cards for 3 turns. 1st card now, 2nd next turn, 3rd turn after.)
 * Actually, Archive: "On each of your next 3 turns" - typically means Turn+1, Turn+2, Turn+3.
 * But it sets aside 3 cards. So it stays for 3 turns.
 */
export const archive: CardDefinition = {
    id: 'archive',
    name: 'Archive',
    description: "+1 Action. +3 Cartes. Mettez-les de côté. Au début de chacun de vos 3 prochains tours, prenez-en une en main.",
    cost: 5,
    types: ['ACTION', 'DURATION'],
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        {
            type: 'MOVE_CARDS',
            count: 3,
            source: 'deck',
            destination: 'aside'
        },
        {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'aside',
            destination: 'hand',
            min: 1,
            max: 1,
            message: 'Archive: Choisissez une carte à mettre en main'
        }
    ],
    durationEffects: [
        {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'aside',
            destination: 'hand',
            min: 1,
            max: 1,
            message: 'Archive: Choisissez une carte à mettre en main'
        }
    ],
    durationTurns: 3,
    set: 'empires',
    expansion: 'empires'
};
