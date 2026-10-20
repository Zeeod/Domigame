import { EffectHandlerRegistry } from '../EffectHandlerRegistry.js';
import { EffectEngine } from '../EffectEngine.js';
import { EffectUtils } from '../EffectUtils.js';
import { CardRegistry } from '../../cards/index.js';
import { chosenInstanceIds } from './OpponentChoiceEffects.js';

/**
 * INSERT_INTO_DECK — Secret Passage: take a card from your hand and put it
 * anywhere in your deck. Two decisions: pick the card, then pick the position
 * (DECK_INSERTION prompt, `index` 0 = top of the deck).
 */
export function registerDeckInsertionEffects(): void {
    EffectHandlerRegistry.register('INSERT_INTO_DECK', (state, player, effect) => {
        if (player.hand.length === 0) return { state, needsChoice: false };
        state.pendingDecision = {
            id: `insert_pick_${Date.now()}`,
            playerId: player.id,
            type: 'CHOOSE_CARDS' as any,
            message: (effect as any).message || 'Choisissez une carte de votre main à placer dans votre pioche',
            constraints: { min: 1, max: 1, sourceZone: 'hand' },
            context: { specialAction: 'SECRET_PASSAGE_PICK' }
        } as any;
        return { state, needsChoice: true };
    });

    EffectEngine.registerDecisionHandler('SECRET_PASSAGE_PICK', (state, playerId, payload) => {
        const player = state.players.find(p => p.id === playerId);
        if (!player) return;
        const id = chosenInstanceIds(payload)[0] ?? player.hand[0]?.instanceId;
        const idx = player.hand.findIndex(c => c.instanceId === id);
        if (idx === -1) return;
        const card = player.hand.splice(idx, 1)[0];

        if (player.deck.length === 0) {
            player.deck.push(card);
            return;
        }
        player.limbo.push(card); // held while the position is chosen
        state.pendingDecision = {
            id: `insert_pos_${Date.now()}`,
            playerId: player.id,
            type: 'DECK_INSERTION' as any,
            message: `Où placer ${CardRegistry.get(card.id)?.name || card.id} dans votre pioche ?`,
            constraints: { min: 1, max: 1, sourceZone: 'hand' },
            context: {
                specialAction: 'SECRET_PASSAGE_INSERT',
                card: { id: card.id, instanceId: card.instanceId },
                cardToMove: { id: card.id, instanceId: card.instanceId },
                deckCount: player.deck.length
            }
        } as any;
    });

    EffectEngine.registerDecisionHandler('SECRET_PASSAGE_INSERT', (state, playerId, payload, decision) => {
        const player = state.players.find(p => p.id === playerId);
        if (!player) return;
        const instanceId = decision.context.card?.instanceId ?? decision.context.cardToMove?.instanceId;
        const card = EffectUtils.removeCardFromPlayer(state, player, instanceId) ?? decision.context.cardToMove;
        if (!card) return;
        const index = Math.max(0, Math.min(Number(payload.index ?? 0), player.deck.length));
        player.deck.splice(index, 0, card);
        EffectUtils.log(state, `${player.name} place une carte dans sa pioche (position ${index + 1}).`, player.id);
    });
}
