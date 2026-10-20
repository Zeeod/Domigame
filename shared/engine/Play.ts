import { GameState, CardInstance } from './GameState.js';
import { PlayerState } from './PlayerState.js';
import { CardRegistry } from '../cards/index.js';
import { DurationManager } from './DurationManager.js';

/**
 * Bookkeeping common to EVERY play of a card (normal play, Throne Room replays,
 * Vassal, Golem, plays from a mat…). Call it BEFORE the card's effects resolve,
 * so that "first time you play X this turn" conditions see the right count.
 */
export function markPlayed(state: GameState, player: PlayerState, card: CardInstance): void {
    card.turnPlayed = state.turnNumber;
    if (!player.playedThisTurn) player.playedThisTurn = {};
    player.playedThisTurn[card.id] = (player.playedThisTurn[card.id] || 0) + 1;
}

/**
 * Push one play of `card` onto the stack: its effects, plus its Duration effects.
 * `holderInstanceId` (e.g. a Throne Room) stays in play as long as the Duration does.
 */
export function pushPlayEffects(state: GameState, player: PlayerState, card: CardInstance, holderInstanceId?: string): void {
    const def = CardRegistry.get(card.id);
    if (!def) return;

    if (def.types.includes('DURATION')) {
        DurationManager.register(state, {
            cardInstanceId: card.instanceId,
            cardId: card.id,
            playerId: player.id,
            turnsRemaining: def.isPermanentDuration ? 'PERMANENT' : (def.durationTurns || 1),
            effects: def.durationEffects || []
        });
        if (holderInstanceId) {
            // Throne Room & co. stay in play with the Duration card they played
            DurationManager.register(state, {
                cardInstanceId: holderInstanceId,
                cardId: player.playArea.find(c => c.instanceId === holderInstanceId)?.id || 'throne_room',
                playerId: player.id,
                turnsRemaining: def.isPermanentDuration ? 'PERMANENT' : (def.durationTurns || 1),
                effects: []
            });
        }
    }

    // Plain Treasures without effects (value only)
    if (def.treasureValue && (!def.effects || def.effects.length === 0)) {
        player.coins += def.treasureValue;
    }

    const items = (def.effects || []).map((e: any) => ({
        type: 'EFFECT' as const,
        playerId: player.id,
        effect: e,
        context: { sourceCardInstanceId: card.instanceId, sourceCardId: card.id }
    }));
    state.effectStack.push(...items.reverse());
}
