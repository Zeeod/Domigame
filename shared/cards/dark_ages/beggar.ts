import { CardDefinition } from '../../types/CardDefinition.js';

export const beggar: CardDefinition = {
    id: 'beggar',
    name: 'Mendiant',
    cost: 2,
    types: ['ACTION', 'REACTION'],
    expansion: 'dark_ages',
    description: 'Recevez 3 Cuivres en main. Quand un autre joueur joue une Attaque, vous pouvez d\'abord défausser cette carte pour recevoir 2 Argents, dont un sur votre pioche.',
    effects: [
        { type: 'GAIN_CARD', cardId: 'copper', destination: 'hand' },
        { type: 'GAIN_CARD', cardId: 'copper', destination: 'hand' },
        { type: 'GAIN_CARD', cardId: 'copper', destination: 'hand' }
    ],
    isReaction: true,
    reactionTrigger: 'ATTACK' as any,
    reactionEffects: [
        { type: 'DISCARD_SELF_FROM_HAND' },
        { type: 'GAIN_CARD', cardId: 'silver', destination: 'deck' },
        { type: 'GAIN_CARD', cardId: 'silver' }
    ] as any
};
