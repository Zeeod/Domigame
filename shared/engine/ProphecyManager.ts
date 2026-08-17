import { GameState } from './GameState.js';
import { LogEventType } from '../types/Log.js';
import { LandscapeRegistry } from '../cards/landscapes/index.js';
import { EffectEngine } from './EffectEngine.js';
import { Logger } from './Logger.js';

export class ProphecyManager {
    /**
     * Activate a prophecy (e.g. at start of game or when one ends/starts)
     */
    static activateProphecy(state: GameState, prophecyId: string, playerCount: number = 2): void {
        const prophecy = LandscapeRegistry.get(prophecyId);
        if (!prophecy) {
            console.error(`[ProphecyManager] Prophecy not found in registry: ${prophecyId}`);
            return;
        }
        if (!prophecy.types.includes('PROPHECY')) return;

        state.activeProphecyId = prophecyId;

        // Sun token scaling: 5, 8, 10, 12, 13 for 2-6 players
        const scaling: Record<number, number> = { 2: 5, 3: 8, 4: 10, 5: 12, 6: 13 };
        let tokens = scaling[playerCount] || 5;

        // Exception: Great Leader starts with 8 tokens at 2 players
        if (prophecyId === 'great_leader') {
            const greatLeaderScaling: Record<number, number> = { 2: 8, 3: 11, 4: 13, 5: 15, 6: 16 };
            tokens = greatLeaderScaling[playerCount] || 8;
        }

        if (!state.landscapeState[prophecyId]) {
            state.landscapeState[prophecyId] = { tokens: {}, state: null };
        }
        state.landscapeState[prophecyId].tokens = { sun: tokens };

        Logger.log(state, `La prophétie ${prophecy.name} est maintenant active avec ${tokens} jetons Soleil!`);

        // Potential setup effects (e.g. Approaching Army adding an Attack pile)
        if (prophecy.onBuy && prophecyId === 'approaching_armies') {
            // Setup logic might be needed elsewhere (Supply generator)
            // But we can apply one-time setup effects here if needed.
        }
    }

    /**
     * Check if the active prophecy is fulfilled by an event
     */
    static checkFulfillment(state: GameState, event: LogEventType, context: any): void {
        if (!state.activeProphecyId) return;

        const prophecyId = state.activeProphecyId;
        const prophecy = LandscapeRegistry.get(prophecyId);
        if (!prophecy || !prophecy.prophecyTrigger) return;

        const trigger = prophecy.prophecyTrigger;

        if (trigger.event === event) {
            let matches = true;
            const filter = trigger.filter;

            if (filter) {
                if (filter.cardTypes && context.cardType) {
                    if (!filter.cardTypes.some((t: string) => context.cardType.includes(t.toUpperCase()))) {
                        matches = false;
                    }
                }
                if (filter.cardId && context.cardId !== filter.cardId) {
                    matches = false;
                }
                if (filter.minCost !== undefined && (context.boughtCost ?? context.cardCost ?? 0) < filter.minCost) {
                    matches = false;
                }
            }

            if (matches) {
                this.removeSunToken(state);
            }
        }
    }

    static removeSunToken(state: GameState): void {
        if (!state.activeProphecyId) return;

        const prophecyId = state.activeProphecyId;
        const prophecyState = state.landscapeState[prophecyId];

        if (prophecyState && prophecyState.tokens && prophecyState.tokens['sun'] > 0) {
            prophecyState.tokens['sun']--;
            Logger.log(state, `Un Jeton Soleil est retiré de la prophétie ${LandscapeRegistry.get(prophecyId)?.name} (Reste: ${prophecyState.tokens['sun']}).`);

            if (prophecyState.tokens['sun'] === 0) {
                this.fulfillProphecy(state);
            }
        }
    }

    static fulfillProphecy(state: GameState): void {
        if (!state.activeProphecyId) return;
        const prophecyId = state.activeProphecyId;
        const prophecy = LandscapeRegistry.get(prophecyId);
        if (!prophecy) return;

        Logger.log(state, `PROPHÉTIE ACCOMPLIE : ${prophecy.name}!`);

        // Execute fulfillment effects for ALL players (Prophecies are global once fulfilled)
        if (prophecy.fulfillmentEffects) {
            for (const player of state.players) {
                EffectEngine.applyEffects(state, player.id, prophecy.fulfillmentEffects);
            }
        }

        // Marking as fulfilled (Sun tokens = 0 is already the indicator for passive effects)
    }
}
