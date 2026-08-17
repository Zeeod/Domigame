import { CardDefinition } from '../../types/CardDefinition.js';

export const courtyard: CardDefinition = {
    id: 'courtyard',
    name: 'Cour',
    cost: 2,
    types: ['ACTION'],
    effects: [
        { type: 'DRAW', amount: 3 },
        { type: 'CHOOSE_FROM_ZONE', sourceZone: 'hand', min: 1, max: 1, destination: 'deck', message: 'Mettez une carte de votre main sur votre deck' }
    ],
    description: '+3 Cartes. Mettez une carte de votre main sur le dessus de votre deck.',
    image: '/card-images/courtyard.jpg',

    expansion: 'Intrigue'
};


