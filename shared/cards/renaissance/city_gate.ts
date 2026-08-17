import { CardDefinition } from '../../types/CardDefinition.js';

export const CityGate: CardDefinition = {
    id: 'city_gate',
    name: 'Porte de la Ville',
    types: ['PROJECT'],
    cost: 3,
    description: "Au début de votre tour, +1 Carte, puis replacez une carte de votre main sur votre deck.",
    onTurnStart: [
        {
            type: 'DRAW',
            amount: 1
        },
        {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'hand',
            destination: 'deck',
            min: 1,
            max: 1,
            message: 'Porte de la Ville: Replacez une carte sur votre deck'
        }
    ],
    expansion: 'Renaissance',
    set: 'renaissance'
};
