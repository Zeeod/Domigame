import { CardDefinition } from '../../types/CardDefinition.js';

export const trading_post: CardDefinition = {
    id: 'trading_post',
    name: 'Poste de traite',
    cost: 5,
    types: ['ACTION'],
    effects: [
        { type: 'TRASH', min: 2, max: 2, from: 'hand', onSuccess: [{ type: 'GAIN_CARD', cardId: 'silver', destination: 'hand' }] }
    ],
    description: 'Écartez 2 cartes de votre main. Si vous l’avez fait, gagnez une carte Argent dans votre main.',
    image: '/card-images/trading_post.jpg',

    expansion: 'Intrigue'
};


