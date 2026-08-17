import { CardDefinition } from '../../types/CardDefinition.js';

export const weaver: CardDefinition = {
    id: 'weaver',
    name: 'Tisserand',
    cost: 4,
    types: ['ACTION', 'REACTION'],
    description: 'Gagnez 2 Argents. \nRéaction: Lorsque vous défaussez cette carte, vous pouvez la jouer.',
    effects: [
        { type: 'GAIN_CARD', cardId: 'silver', count: 2, destination: 'discardPile' }
    ],
    isReaction: true,
    reactionTrigger: 'DISCARD',
    onDiscard: [
        { type: 'PLAY_THIS_CARD', optional: true }
    ],
    expansion: 'Hinterlands',
    set: 'hinterlands',
    isLegacy: false
};
