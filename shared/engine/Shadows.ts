import { GameState, PlayerState, CardInstance } from './GameState.js';
import { CardRegistry } from '../cards/index.js';

/**
 * Rising Sun — Shadow cards: "You can play this from your deck as if in your hand."
 * Whenever you could play an Action card from your hand, a Shadow card anywhere in your deck can be played instead.
 */
export const isShadow = (id: string) => !!CardRegistry.get(id)?.types.includes('SHADOW' as any);

/** Shadow cards in this player's deck (they can be played as if in hand). */
export function deckShadows(player: PlayerState): CardInstance[] {
    return player.deck.filter(c => isShadow(c.id));
}

/** A Shadow in the deck chosen to be played: move it into the hand, from where it is played right away. */
export function takeShadowToHand(player: PlayerState, instanceId: string): boolean {
    if (player.hand.some(c => c.instanceId === instanceId)) return true;
    const i = player.deck.findIndex(c => c.instanceId === instanceId && isShadow(c.id));
    if (i === -1) return false;
    player.hand.push(player.deck.splice(i, 1)[0]);
    return true;
}

/** True if this instance is a Shadow card in the player's deck, and an Action could be played now. */
export function canPlayShadowFromDeck(state: GameState, player: PlayerState, instanceId: string): boolean {
    return state.phase === 'ACTION' && player.deck.some(c => c.instanceId === instanceId && isShadow(c.id));
}
