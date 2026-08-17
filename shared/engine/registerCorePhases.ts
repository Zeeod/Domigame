
import { GameState, getCurrentPlayer } from './GameState.js';
import { CardRegistry } from '../cards/index.js';
import { PhaseEngine } from './PhaseEngine.js';
import { CleanupEffectHandler } from './effects/CleanupEffectHandler.js';
import { TriggerEffectHandler } from './effects/TriggerEffectHandler.js';

/**
 * Register the default Dominion phases.
 * Called once at module load time.
 */
export function registerDefaultPhases(): void {

    PhaseEngine.register({
        id: 'ACTION',
        label: 'Phase Action',
        canEnter: () => true,
        autoSkip: (state: GameState) => {
            const player = getCurrentPlayer(state);
            if (!player) return true;
            return !player.hand.some(card => {
                const def = CardRegistry.get(card.id);
                return def?.types.includes('ACTION');
            });
        }
    });

    PhaseEngine.register({
        id: 'BUY',
        label: 'Phase Achat',
        canEnter: () => true,
        onEnter: (state: GameState) => {
            const player = getCurrentPlayer(state);
            if (player) {
                TriggerEffectHandler.handlePhaseTriggers(state, player, 'START_BUY_PHASE');
            }
        },
        autoSkip: (state: GameState) => {
            const player = getCurrentPlayer(state);
            if (!player) return true;
            const isFlourishingTrade = state.activeProphecyId === 'flourishing_trade' &&
                state.landscapeState?.['flourishing_trade']?.tokens?.sun === 0;
            const availableBuys = player.buys + (isFlourishingTrade ? player.actions : 0);
            return availableBuys <= 0;
        }
    });

    PhaseEngine.register({
        id: 'NIGHT',
        label: 'Phase de Nuit',
        canEnter: (state: GameState) => {
            const player = getCurrentPlayer(state);
            // Enter Night if there are Night cards in hand or in the Kingdom
            const hasNightInHand = player?.hand.some(c => CardRegistry.get(c.id)?.types.includes('NIGHT'));
            const kingdomHasNight = Object.keys(state.supply).some(id => CardRegistry.get(id)?.types.includes('NIGHT'));
            return !!(hasNightInHand || kingdomHasNight);
        },
        autoSkip: (state: GameState) => {
            const player = getCurrentPlayer(state);
            if (!player) return true;
            return !player.hand.some(c => CardRegistry.get(c.id)?.types.includes('NIGHT'));
        }
    });

    PhaseEngine.register({
        id: 'CLEANUP',
        label: 'Phase de Nettoyage',
        canEnter: () => true,
        onEnter: (state: GameState) => {
            const player = getCurrentPlayer(state);
            if (player) {
                CleanupEffectHandler.handlePerformCleanup(state, player);
            }
        }
    });
}

// Auto-register on import
registerDefaultPhases();
