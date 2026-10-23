import { CardDefinition } from '../../types/CardDefinition.js';

export const rebuild: CardDefinition = {
    id: 'rebuild',
    name: 'Reconstruction',
    cost: 5,
    types: ['ACTION'],
    expansion: 'dark_ages',
    description: '+1 Action. Nommez une carte. Dévoilez des cartes de votre pioche jusqu\'à dévoiler une carte Victoire autre que celle nommée. Défaussez les autres, écartez la carte Victoire et recevez une carte Victoire coûtant jusqu\'à 3 💰 de plus.',
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'REBUILD' }
    ] as any
};
