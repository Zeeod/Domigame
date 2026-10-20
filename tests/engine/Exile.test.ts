import { describe, it, expect, beforeEach } from 'vitest';
import { createGameState, PlayerState } from '../../shared/engine/GameState.js';
import { ZoneEffectHandler } from '../../shared/engine/effects/ZoneEffectHandler.js';
import { GainEffectHandler } from '../../shared/engine/effects/GainEffectHandler.js';
import { TriggerEffectHandler } from '../../shared/engine/effects/TriggerEffectHandler.js';
import { createCardInstance } from '../../shared/engine/CardInstance.js';
import { createPlayerState } from '../../shared/engine/PlayerState.js';

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

    it('offers to discard exiled copies when gaining a matching card', () => {
        const goldInExile = createCardInstance('gold');
        player.mats['exile'] = [goldInExile];

        // Gain a new gold
        TriggerEffectHandler.handleOnGainTriggers(state, player, 'gold');

        // "You may discard copies from Exile": a Yes/No choice whose Yes takes them from the mat
        expect(state.effectStack.length).toBe(1);
        const choice = state.effectStack[0].effect as any;
        expect(choice.type).toBe('SELECT_OPTION');
        const yes = choice.options[0].effects[0];
        expect(yes.type).toBe('TAKE_FROM_MAT');
        expect(yes.mat).toBe('exile');
        expect(yes.targetCardIds).toContain('gold');
        expect(yes.destination).toBe('discardPile');
    });

    it('should prompt to exile when gaining with exile_prompt destination', () => {
        const result = GainEffectHandler.handleGainCard(state, player, { cardId: 'gold', destination: 'exile_prompt' });

        expect(result.needsChoice).toBe(true);
        expect(state.pendingDecision?.type).toBe('SELECT_OPTION');
        expect(state.pendingDecision?.message).toContain('exiler');
        expect(player.limbo.length).toBe(1);
    });
});
