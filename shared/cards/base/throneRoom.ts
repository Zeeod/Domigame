/**
 * Throne Room - Base Action Card
 * You may play an Action card from your hand twice.
 */
import { CardDefinition } from '../../types/CardDefinition.js';

export const throneRoom: CardDefinition = {
    id: 'throne_room',
    name: 'Trône',
    cost: 4,
    types: ['ACTION'],
    effects: [
        {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'hand',
            min: 1,
            max: 1,
            filter: { cardTypes: ['ACTION'] },
            message: 'Choisissez une action à jouer deux fois',
            destination: 'playArea',
            effects: [
                { type: 'PLAY_ACTION_TWICE' }
            ],
            optional: true
        }
    ],
    description: 'Choisissez une carte Action de votre main et jouez-la deux fois.',
    image: '/card-images/throne_room.jpg',

    expansion: 'Base'
};
