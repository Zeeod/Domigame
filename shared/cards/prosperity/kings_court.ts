import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * King's Court - Prosperity 2nd Edition
 * Cost: 7
 * Types: ACTION
 * Text: You may play an Action card from your hand three times.
 */
export const kingsCourt: CardDefinition = {
    id: 'kings_court',
    name: 'Roi de la cour',
    cost: 7,
    types: ['ACTION'],
    expansion: 'Prosperity',
    set: 'prosperity',
    description: 'Choisissez une carte Action de votre main et jouez-la trois fois.',
    effects: [
        {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'hand',
            min: 1,
            max: 1,
            filter: { cardTypes: ['ACTION'] },
            message: 'Choisissez une action à jouer trois fois',
            destination: 'playArea',
            effects: [
                { type: 'PLAY_ACTION_MULTIPLE', multiplier: 3 } as any
            ],
            optional: true
        }
    ]
};
