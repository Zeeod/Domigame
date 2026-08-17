import { CardDefinition } from '../../types/CardDefinition.js';

export const trail: CardDefinition = {
    id: 'trail',
    name: 'Sentier',
    cost: 4,
    types: ['ACTION', 'REACTION'],
    description: '+1 Carte; +1 Action; +1 💰. \nRéaction: Lorsque cette carte est gagnée, écartée ou défaussée, vous pouvez la jouer.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_MONEY', amount: 1 }
    ],
    isReaction: true,
    reactionTrigger: 'ANY', // TRIGGER ON GAIN / TRASH / DISCARD
    reactionEffects: [
        { type: 'PLAY_THIS_CARD' }
    ],
    // Triggers required to activate reaction opportunity or auto-play
    onGain: [{ type: 'PLAY_THIS_CARD', optional: true }],
    onTrash: [{ type: 'PLAY_THIS_CARD', optional: true }],
    onDiscard: [{ type: 'PLAY_THIS_CARD', optional: true }],
    expansion: 'Hinterlands',
    set: 'hinterlands',
    isLegacy: false
};
