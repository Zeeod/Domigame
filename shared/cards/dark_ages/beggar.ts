import { CardDefinition } from '../../types/CardDefinition.js';

export const beggar: CardDefinition = {
    id: 'beggar',
    name: 'Mendiant',
    cost: 2,
    types: ['ACTION', 'REACTION'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: 'Gagnez 3 Cuivres en main. Quand un autre joueur joue une Attaque, vous pouvez défausser cette carte. Si vous le faites, gagnez 2 Argents, un sur votre deck.',
    effects: [
        { type: 'GAIN_CARD', cardId: 'copper', destination: 'hand' },
        { type: 'GAIN_CARD', cardId: 'copper', destination: 'hand' },
        { type: 'GAIN_CARD', cardId: 'copper', destination: 'hand' }
    ],
    reactionEffects: [
        { type: 'DISCARD_SELF' } as any,
        { type: 'GAIN_CARD', cardId: 'silver', destination: 'deck' },
        { type: 'GAIN_CARD', cardId: 'silver', destination: 'discardPile' }
    ]
};
