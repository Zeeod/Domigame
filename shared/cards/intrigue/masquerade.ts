import { CardDefinition } from '../../types/CardDefinition.js';

export const masquerade: CardDefinition = {
    id: 'masquerade',
    name: 'Mascarade',
    cost: 3,
    types: ['ACTION'],
    effects: [
        { type: 'DRAW', amount: 2 },
        { type: 'PASS_TO_LEFT' },
        { type: 'TRASH', min: 0, max: 1, from: 'hand', message: 'Mascarade : vous pouvez écarter une carte de votre main' }
    ],
    description: '+2 Cartes. Chaque joueur choisit simultanément une carte de sa main et la passe au joueur à sa gauche. Ensuite, vous pouvez écarter une carte de votre main.',
    image: '/card-images/masquerade.jpg',
    expansion: 'intrigue'
};
