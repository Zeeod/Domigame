import { CardDefinition } from '../../types/CardDefinition';

/**
 * Fool's Gold (Or des fous) — Hinterlands 2nd Edition
 * Cost 2 — Treasure – Reaction
 * If this is the first time you played a Fool's Gold this turn, $1, otherwise $4.
 * When another player gains a Province, you may trash this from your hand, to gain a Gold onto your deck.
 */
export const fools_gold: CardDefinition = {
    id: 'fools_gold',
    name: 'Or des fous',
    cost: 2,
    types: ['TREASURE', 'REACTION'],
    expansion: 'hinterlands',
    description: 'Si c\'est la première fois que vous jouez un Or des fous ce tour-ci, 1 💰, sinon 4 💰. Quand un autre joueur reçoit une Province, vous pouvez écarter cette carte de votre main pour recevoir un Or sur votre pioche.',
    treasureValue: 0,
    effects: [{ type: 'FOOLS_GOLD' }] as any,
    isReaction: true,
    reactionTrigger: 'ANY_GAIN' as any,
    reactionCondition: { type: 'GAIN_ID', value: 'province', othersOnly: true } as any,
    reactionMessage: 'Or des fous : l\'écarter pour recevoir un Or sur votre pioche ?',
    reactionEffects: [{ type: 'FOOLS_GOLD_REACT' }] as any
} as any;
