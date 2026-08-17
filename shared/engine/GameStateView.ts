
import { GameState, PlayerState, CardInstance } from './GameState.js';
import { produce } from 'immer';
import { StatsCalculator } from './StatsCalculator.js';

/**
 * GameStateView - Handles "Fog of War" by sanitizing the state for a specific player.
 * 
 * This ensures that sensitive data (opponent hands, deck order) is never sent
 * over the network, preventing client-side cheating.
 */
export class GameStateView {
    /**
     * Create a sanitized view of the game state for a specific viewer.
     */
    static createPlayerView(state: GameState, viewerId: string): GameState {
        return produce(state, (draft: GameState) => {
            // 1. Remove sensitive global data
            // @ts-ignore - removing rng state which shouldn't be on client anyway
            delete (draft as any).rng;

            // 2. Sanitize each player
            draft.players.forEach((p, idx) => {
                draft.players[idx] = this.sanitizePlayer(draft as any, p, viewerId === p.id);
            });

            // 3. Sanitize Supply and Non-Supply (mixed piles)
            this.sanitizePiles(draft.supply);
            this.sanitizePiles(draft.nonSupply);

            // 4. Sanitize other zones
            if (draft.trash) {
                // Trash is public, no change needed usually
            }
        });
    }

    private static sanitizePiles(piles: Record<string, any>) {
        if (!piles) return;
        for (const pileId in piles) {
            const pile = piles[pileId];
            if (pile.isMixed || pile.cardId === 'loot_pile' || pile.cardId === 'knights') {
                // Hide all cards in the pile except the count
                // We keep the top card ID IF it's supposed to be visible (e.g. Knights top card is visible)
                // For Loot, it's usually face down. 
                pile.cards = (pile.cards || []).map(() => ({ id: 'back', instanceId: 'hidden' }));
            }
        }
    }

    private static sanitizePlayer(state: GameState, player: PlayerState, isViewer: boolean): any {
        // Create a copy of the player state
        const sanitized: any = { ...player };

        if (!isViewer) {
            // Mask opponent's hand
            sanitized.hand = player.hand.map(c => this.createHiddenCard(c.instanceId));

            // Mask opponent's deck (count only)
            sanitized.deck = player.deck.map(c => this.createHiddenCard(c.instanceId));

            // Mask opponent's discard (Optional: in Dominion discard is public, 
            // but some engine versions keep it hidden or only top card. 
            // For now we keep it visible to follow Dominion rules, 
            // UNLESS specialized masking is required.)
            // sanitized.discardPile = ... (keeping as is)
        } else {
            // Mask own deck order
            sanitized.deck = player.deck.map(c => this.createHiddenCard(c.instanceId));

            // Calculate deck stats for viewer
            sanitized.deckStats = StatsCalculator.calculate(state, player.id);
        }

        // Mask private mats
        const privateMats = ['nativeVillage'];

        if (sanitized.mats) {
            sanitized.mats = { ...player.mats };
            for (const matName of privateMats) {
                if (!isViewer && sanitized.mats[matName]) {
                    sanitized.mats[matName] = sanitized.mats[matName].map((c: any) => this.createHiddenCard(c.instanceId));
                }
            }
        }

        // Legacy mats sync (for backward compatibility during Phase 2)
        if (!isViewer && sanitized.nativeVillageMat) {
            sanitized.nativeVillageMat = sanitized.nativeVillageMat.map((c: any) => this.createHiddenCard(c.instanceId));
        }

        // Shared public data (Artifacts, Projects, Tokens) are kept on sanitized object
        return sanitized;
    }

    /**
     * Create a dummy card representation for hidden data.
     */
    private static createHiddenCard(instanceId: string): CardInstance {
        return {
            id: 'back', // Standard "card back" ID
            instanceId: instanceId // We keep instanceId so the UI can track entity identity
        };
    }
}
