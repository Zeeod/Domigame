import { CardDefinition } from '../../types/CardDefinition.js';

export const raze: CardDefinition = {
    id: 'raze',
    name: 'Raser',
    types: ['ACTION'],
    cost: 2,
    expansion: 'adventures',
    description: '+1 Action. Écartez cette carte ou une carte de votre main. Regardez une carte du dessus de votre pioche par 💰 que coûte la carte écartée. Prenez-en une en main et défaussez le reste.',
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'RAZE' }
    ] as any
};
