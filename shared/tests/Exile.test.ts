import { describe, it, expect, beforeEach } from 'vitest';
import { createGameState, PlayerState } from '../engine/GameState.js';
import { ZoneEffectHandler } from '../engine/effects/ZoneEffectHandler.js';
import { GainEffectHandler } from '../engine/effects/GainEffectHandler.js';
import { TriggerEffectHandler } from '../engine/effects/TriggerEffectHandler.js';
import { createCardInstance } from '../engine/CardInstance.js';
import { createPlayerState } from '../engine/PlayerState.js';

describe('Exile Mechanics', () => {
    let state: any;
    let player: PlayerState;

    beforeEach(() => {
        state = createGameState('test');
        player = createPlayerState('p1', 'P1');
        state.players = [player];
        state.supply['gold'] = { count: 10, tokens: {} };
    });

    it('should move cards to exile mat', () => {
        const gold = createCardInstance('gold');
        player.hand = [gold];

        ZoneEffectHandler.handleMoveToMat(state, player, { mat: 'exile', targetCardInstanceId: gold.instanceId });

        expect(player.mats['exile']).toContainEqual(gold);
        expect(player.hand).not.toContainEqual(gold);
    });

    it('should auto-retrieve from exile when gaining a matching card', () => {
        const goldInExile = createCardInstance('gold');
        player.mats['exile'] = [goldInExile];

        // Gain a new gold
        TriggerEffectHandler.handleOnGainTriggers(state, player, 'gold');

        // Check effect stack has TAKE_FROM_MAT
        expect(state.effectStack.length).toBe(1);
        expect(state.effectStack[0].effect.type).toBe('TAKE_FROM_MAT');
        expect(state.effectStack[0].effect.mat).toBe('exile');
        expect(state.effectStack[0].effect.targetCardIds).toContain('gold');
    });

    it('should prompt to exile when gaining with exile_prompt destination', () => {
        const result = GainEffectHandler.handleGainCard(state, player, { cardId: 'gold', destination: 'exile_prompt' });

        expect(result.needsChoice).toBe(true);
        expect(state.pendingDecision?.type).toBe('SELECT_OPTION');
        expect(state.pendingDecision?.message).toContain('exiler');
        expect(player.limbo.length).toBe(1);
    });
});
