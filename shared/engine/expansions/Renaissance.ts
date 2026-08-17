/**
 * Renaissance Expansion Module
 * 
 * Registers Renaissance-specific mechanics:
 * - Treasure Chest artifact: Gain a Gold at start of Buy phase
 * - Key artifact: +1 Coin at start of turn
 * - Flag artifact: +1 Card during cleanup draw
 */

import { ExpansionModule } from '../ExpansionLoader.js';
import { EffectEngine } from '../EffectEngine.js';
import { Logger } from '../Logger.js';

export const RenaissanceModule: ExpansionModule = {
    id: 'renaissance',
    name: 'Renaissance',

    eventHooks: [
        {
            id: 'renaissance:treasure_chest',
            event: 'PHASE_ENTER',
            priority: 'NORMAL',
            handler: (state, event) => {
                if (event.context?.phaseId !== 'BUY') return;

                const player = state.players.find(p => p.id === event.playerId);
                if (!player) return;
                if (!player.artifacts?.includes('treasure_chest')) return;

                EffectEngine.applyEffects(state, player.id, [
                    { type: 'GAIN_CARD', cardId: 'gold', destination: 'discardPile' }
                ], false);

                Logger.log(state, `${player.name} a le Coffre au Trésor (Gagne un Or).`, player.id);
            }
        },
        {
            id: 'renaissance:key',
            event: 'TURN_START',
            priority: 'NORMAL',
            handler: (state, event) => {
                const player = state.players.find(p => p.id === event.playerId);
                if (!player) return;
                if (!player.artifacts?.includes('key')) return;

                player.coins += 1;
                Logger.log(state, `${player.name} a la Clé (+1 💰).`, player.id);
            }
        },
        {
            id: 'renaissance:flag',
            event: 'CLEANUP_START',
            priority: 'NORMAL',
            handler: (_state, _event) => {
                // Flag is handled by checking artifacts at cleanup draw time.
                // This hook is for documentation; the actual +1 draw is
                // applied in TurnMachine.finalizeCleanup where drawCount is computed.
                // To fully decouple, we would need a 'MODIFY_CLEANUP_DRAW' event.
            }
        }
    ]
};
