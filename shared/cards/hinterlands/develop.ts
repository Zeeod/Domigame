import { CardDefinition } from '../../types/CardDefinition.js';

export const develop: CardDefinition = {
    id: 'develop',
    name: 'Développement',
    types: ['ACTION'],
    cost: 3,
    expansion: 'hinterlands',
    description: 'Écartez une carte de votre main. Recevez une carte coûtant exactement 1 💰 de plus et une carte coûtant exactement 1 💰 de moins, dans l\'ordre de votre choix, sur votre pioche.',
    effects: [
        { type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Développement : écartez une carte', onSuccess: [{ type: 'DEVELOP' }] }
    ] as any
};
