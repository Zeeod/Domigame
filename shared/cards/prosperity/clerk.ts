import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Clerk (Greffier) — Prosperity 2nd Edition
 * Cost 4 — Action – Attack – Reaction
 * +$2. Each other player with 5 or more cards in hand puts one onto their deck.
 * At the start of your turn, you may play this from your hand.
 */
export const clerk: CardDefinition = {
    id: 'clerk',
    name: 'Clerc',
    cost: 4,
    types: ['ACTION', 'ATTACK', 'REACTION'],
    expansion: 'prosperity',
    description: '+2 💰. Chaque autre joueur ayant 5 cartes ou plus en main en place une sur sa pioche. Au début de votre tour, vous pouvez jouer cette carte depuis votre main.',
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        {
            type: 'ATTACK',
            attackEffect: [
                {
                    type: 'CONDITION',
                    condition: 'HAND_SIZE',
                    comparator: '>=',
                    value: 5,
                    trueEffects: [
                        {
                            type: 'CHOOSE_FROM_ZONE',
                            sourceZone: 'hand',
                            destination: 'deck',
                            min: 1,
                            max: 1,
                            message: 'Greffier : placez une carte de votre main sur votre pioche.'
                        }
                    ]
                }
            ]
        } as any
    ],
    // "At the start of your turn, you may play this from your hand"
    isReaction: true,
    reactionTrigger: 'START_TURN' as any,
    reactionEffects: [{ type: 'PLAY_THIS_CARD' } as any]
};
