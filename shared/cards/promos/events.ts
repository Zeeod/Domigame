import { CardDefinition } from '../../types/CardDefinition.js';

export const summon: CardDefinition = {
    id: 'summon',
    name: 'Appel',
    cost: 5,
    types: ['EVENT'],
    description: "Une seule fois par partie : recevez une carte Action coûtant jusqu'à 4 💰. Au début de votre prochain tour, jouez-la.",
    effects: [
        {
            type: 'GAIN_CARD',
            maxCost: 4,
            destination: 'aside',
            onSuccess: [
                {
                    type: 'REGISTER_TRIGGER',
                    trigger: 'START_TURN',
                    effects: [{ type: 'PLAY_TARGET' }]
                }
            ]
        }
    ],
    expansion: 'promos'
};
