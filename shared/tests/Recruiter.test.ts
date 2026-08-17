import { describe, it, expect, beforeEach } from 'vitest';
import { createGameState, PlayerState } from '../engine/GameState.js';
import { ExpansionEffectHandler } from '../engine/effects/ExpansionEffectHandler.js';
import { BasicEffectHandler } from '../engine/effects/BasicEffectHandler.js';
import { createCardInstance } from '../engine/CardInstance.js';
import { createPlayerState } from '../engine/PlayerState.js';

describe('Recruiter', () => {
    let state: any;
    let player: PlayerState;

    beforeEach(() => {
        state = createGameState('test');
        player = createPlayerState('p1', 'P1');
        state.players = [player];
    });

    it('should prompt for trashing a card', () => {
        player.hand = [createCardInstance('estate')];
        const result = ExpansionEffectHandler.handleRecruiterEffect(state, player, {});

        expect(result.needsChoice).toBe(true);
        expect(state.pendingDecision?.context.specialAction).toBe('RECRUITER_TRASH');
    });

    it('should gain villagers based on trashed card cost', () => {
        const trashedCard = createCardInstance('silver');
        state.lastDecisionResults = { cards: [trashedCard] };
        state.lastTrashedCard = trashedCard;

        const effect = { type: 'GAIN_STATS_BY_COST', resource: 'villagers', stats: { moneyMultiplier: 1 } };
        BasicEffectHandler.handleGainStatsByCost(state, player, effect);

        // Silver cost is 3
        expect(player.tokens.villagers).toBe(3);
        expect(player.villagers).toBe(3);
    });
});
