/**
 * Discarding a card: the single place where "when you discard this" abilities fire.
 *
 * Use discardCard / discardCards whenever the rules say "discard". Putting a card into the
 * discard pile without discarding it (gaining, Chancellor's deck, Lich) is not a discard.
 */
import type { GameState, PlayerState, CardInstance } from './GameState.js';
import { CardRegistry } from '../cards/index.js';

export function discardCard(state: GameState, player: PlayerState, card: CardInstance): void {
    player.discardPile.push(card);
    // Tunnel, Weaver, Trail, Village Green…: "when you discard this other than during Clean-up"
    if (state.phase === 'CLEANUP') return;
    const def = CardRegistry.get(card.id) as any;
    const effects = def?.onDiscardOutsideCleanup;
    if (!effects) return;
    const list = Array.isArray(effects) ? effects : [effects];
    for (let i = list.length - 1; i >= 0; i--) {
        state.effectStack.push({
            type: 'EFFECT', playerId: player.id, effect: list[i],
            context: { sourceCardInstanceId: card.instanceId, sourceCardId: card.id }
        });
    }
}

export function discardCards(state: GameState, player: PlayerState, cards: CardInstance[]): void {
    for (const c of cards) discardCard(state, player, c);
}
