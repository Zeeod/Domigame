import { CardDefinition } from '../../types/CardDefinition.js';

export const berserker: CardDefinition = {
    id: 'berserker',
    name: 'Berserker',
    cost: 5,
    types: ['ACTION', 'ATTACK'],
    description: 'Recevez une carte coûtant moins que cette carte. Chaque autre joueur défausse jusqu\'à avoir 3 cartes en main. Quand vous recevez cette carte, si vous avez une carte Action en jeu, jouez-la.',
    effects: [
        { type: 'GAIN_CHEAPER_THAN', cardId: 'berserker' },
        { type: 'ATTACK', attackEffects: [{ type: 'DISCARD_TO_HAND_SIZE', targetSize: 3 }] }
    ] as any,
    onGain: [{ type: 'BERSERKER_ON_GAIN' }] as any,
    expansion: 'hinterlands',
    isLegacy: false
};
