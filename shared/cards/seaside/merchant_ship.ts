import { CardDefinition } from '../../types/CardDefinition';

export const merchantShip: CardDefinition = {
    id: 'merchant_ship',
    name: 'Navire marchand',
    types: ['ACTION', 'DURATION'],
    description: 'Maintenant et au début de votre prochain tour : +2 Pièces.',
    cost: 5,
    set: 'seaside',
    effects: [
        { type: 'ADD_MONEY', amount: 2 }
    ],
    durationEffects: [
        { type: 'ADD_MONEY', amount: 2 }
    ],
    image: '/card-images/merchant_ship.jpg'
};
