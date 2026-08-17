
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameState, PlayerState } from './shared/engine/GameState.js';
import { EffectEngine } from './shared/engine/EffectEngine.js';
import { CardRegistry } from './shared/cards/index.js';
import { AttackEffectHandler } from './shared/engine/effects/AttackEffectHandler.js';
// import { createInitialGameState } from './server/GameRoomV2.js'; // Unused now
import { PhaseEngine } from './shared/engine/PhaseEngine.js';

// Mock specific cards if needed, or use real ones
// We need Witch (Attack), Diplomat (Reaction, Non-Blocking), Moat (Reaction, Blocking)

describe('Reaction Loop Reproduction', () => {
    let state: GameState;
    let attacker: PlayerState;
    let defender: PlayerState;

    beforeEach(() => {
        // Mock minimal state
        state = {
            players: [
                { id: 'p1', name: 'Attacker', hand: [], discardPile: [], deck: [], playArea: [], aside: [], score: 0, coffers: 0, villagers: 0, debt: 0, actions: 1, buys: 1, coins: 0, favors: 0 },
                { id: 'p2', name: 'Defender', hand: [], discardPile: [], deck: [], playArea: [], aside: [], score: 0, coffers: 0, villagers: 0, debt: 0, actions: 1, buys: 1, coins: 0, favors: 0 }
            ],
            supply: {
                witch: { count: 10, tokens: {} },
                diplomat: { count: 10, tokens: {} },
                moat: { count: 10, tokens: {} },
                curse: { count: 10, tokens: {} }, // Needed for Witch
                copper: { count: 60, tokens: {} }
            },
            trash: [],
            effectStack: [],
            phase: 'ACTION',
            currentPlayerIndex: 0,
            logs: [],
            history: [],
            nonSupply: {},
            phasePipeline: ['ACTION', 'BUY', 'CLEANUP'],
            phaseIndex: 0
        } as any;

        attacker = state.players[0];
        defender = state.players[1];

        // Attacker has Witch
        const witch = { id: 'witch', instanceId: 'w1' };
        attacker.hand.push(witch);

        // Defender has Diplomat, Moat, and 3 Coppers (total 5 for Diplomat condition)
        const diplomat = { id: 'diplomat', instanceId: 'd1' };
        const moat = { id: 'moat', instanceId: 'm1' };
        const copper1 = { id: 'copper', instanceId: 'c1' };
        const copper2 = { id: 'copper', instanceId: 'c2' };
        const copper3 = { id: 'copper', instanceId: 'c3' };

        defender.hand.push(diplomat, moat, copper1, copper2, copper3);

        // Mock deck for Diplomat draw
        defender.deck.push({ id: 'copper', instanceId: 'c4' }, { id: 'copper', instanceId: 'c5' });
    });

    it('should allow chaining reactions (Diplomat then Moat)', () => {
        // 1. Setup Attack
        const attackEffect = { type: 'GAIN_CURSE' };
        const resolveAttackEffect = {
            type: 'RESOLVE_ATTACK',
            playerId: defender.id,
            effect: attackEffect,
            context: { attackerId: attacker.id, sourceCardInstanceId: 'w1' }
        };
        state.effectStack.push(resolveAttackEffect as any);

        console.log('--- Initial processStack ---');
        EffectEngine.processStack(state);

        expect((state.pendingDecision as any)?.context.specialAction).toBe('REACTION_DECISION');
        const reactionDecisionContext = { ...state.pendingDecision?.context };

        // 2. Simulate Choosing Diplomat via handleReactionDecision
        const diplomatCard = defender.hand.find(c => c.id === 'diplomat')!;
        const decisionPayload = {
            type: 'CARDS',
            cardInstanceIds: [diplomatCard.instanceId]
        };

        console.log('--- resolveDecision (Diplomat) ---');
        // This should trigger Diplomat effects and then push RESOLVE_ATTACK
        EffectEngine.resolveDecision(state, defender.id, decisionPayload as any);

        // Diplomat reaction: DRAW 2 (sync), then DISCARD 3 (async/prompt)
        expect((state.pendingDecision as any)?.context.specialAction).toBe('DISCARD');
        console.log('SUCCESS: Discard prompt after Diplomat');

        // 3. Simulate Handling Discard (completes Diplomat, triggers REACTION loop)
        const toDiscard = defender.hand.slice(0, 3);
        state.lastDecisionResults = { cards: toDiscard };
        state.pendingDecision = null;

        console.log('--- processStack after Discard ---');
        EffectEngine.processStack(state);

        // Should return to reaction loop
        expect((state.pendingDecision as any)?.context.specialAction).toBe('REACTION_DECISION');
        console.log('SUCCESS: Prompted for reaction AGAIN after Diplomat');

        // 4. Choose Moat
        const moatCard = defender.hand.find(c => c.id === 'moat')!;
        const decisionPayload2 = {
            type: 'CARDS',
            cardInstanceIds: [moatCard.instanceId]
        };

        console.log('--- resolveDecision (Moat) ---');
        EffectEngine.resolveDecision(state, defender.id, decisionPayload2 as any);

        // Moat blocks. Attack should NOT happen.
        const curses = defender.discardPile.filter(c => c.id === 'curse');
        expect(curses.length).toBe(0);
        console.log('SUCCESS: Attack blocked by Moat');
    });
});
