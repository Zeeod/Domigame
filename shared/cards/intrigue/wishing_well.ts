import { CardDefinition } from '../../types/CardDefinition.js';

export const wishing_well: CardDefinition = {
    id: 'wishing_well',
    name: 'Puits aux souhaits',
    cost: 3,
    types: ['ACTION'],
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'NAME_CARD' }
    ],
    description: '+1 Carte, +1 Action. Nommez une carte. Dévoilez la carte du dessus de votre deck. Si c’est la carte nommée, ajoutez-la à votre main.',
    image: '/card-images/wishing_well.jpg',
    expansion: 'Intrigue'
};
