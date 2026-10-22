import { CardDefinition } from '../../types/CardDefinition.js';

export const Transmute: CardDefinition = {
    id: 'transmute',
    name: 'Transmutation',
    types: ['ACTION'],
    cost: 0,
    potionCost: 1,
    expansion: 'alchemy',
    description: 'Écartez une carte de votre main. Si c\'est une carte… Action, recevez un Duché ; Trésor, recevez une Transmutation ; Victoire, recevez un Or.',
    effects: [
        { type: 'TRASH', from: 'hand', min: 1, max: 1, message: 'Transmutation : écartez une carte', onSuccess: [{ type: 'TRANSMUTE_GAIN' }] }
    ] as any
};
