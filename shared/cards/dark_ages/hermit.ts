import { CardDefinition } from '../../types/CardDefinition.js';

export const hermit: CardDefinition = {
    id: 'hermit',
    name: 'Ermite',
    cost: 3,
    types: ['ACTION'],
    expansion: 'dark_ages',
    description: 'Regardez votre défausse. Vous pouvez écarter une carte non-Trésor de votre défausse ou de votre main. Recevez une carte coûtant jusqu\'à 3 💰. Quand vous défaussez cette carte du jeu, si vous n\'avez acheté aucune carte ce tour-ci, écartez-la et recevez un Fou.',
    effects: [
        { type: 'HERMIT' },
        { type: 'GAIN_CARD', maxCost: 3 }
    ] as any,
    onDiscard: [{ type: 'HERMIT_ON_DISCARD' }] as any
};
