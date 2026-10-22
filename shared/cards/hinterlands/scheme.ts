import { CardDefinition } from '../../types/CardDefinition.js';

export const scheme: CardDefinition = {
    id: 'scheme',
    name: 'Stratagème',
    types: ['ACTION'],
    cost: 3,
    expansion: 'hinterlands',
    description: '+1 Carte, +1 Action. Ce tour-ci, vous pouvez placer une de vos cartes Action sur votre pioche quand vous la défaussez du jeu.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'SCHEME' }
    ] as any,
};
