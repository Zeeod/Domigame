
import { describe, it, expect } from 'vitest';
import { GameState, PlayerState } from '../engine/GameState';
import { ActionResolver } from '../engine/ActionResolver';
import { TurnMachine } from '../engine/TurnMachine';

function createMockState(): GameState {
    const p1: PlayerState = {
        id: 'p1', name: 'Player 1',
        hand: [], deck: [], discardPile: [], playArea: [],
        actions: 1, buys: 1, coins: 0,
        turnNumber: 1,
        projects: [],
        favors: 0,
        villagers: 0,
        coffers: 0,
        debt: 0
    } as any;

    const p2: PlayerState = {
        id: 'p2', name: 'Player 2',
        hand: [], deck: [], discardPile: [], playArea: [],
        actions: 1, buys: 1, coins: 0,
        turnNumber: 1,
        projects: [],
        favors: 0,
        villagers: 0,
        coffers: 0,
        debt: 0
    } as any;

    return {
        players: [p1, p2],
        supply: {
            'village': { cardId: 'village', count: 10, cards: [] },
            'smithy': { cardId: 'smithy', count: 10, cards: [] },
            'market': { cardId: 'market', count: 10, cards: [] },
            'procession': { cardId: 'procession', count: 10, cards: [] },
            'enchantress': { cardId: 'enchantress', count: 10, cards: [] },
            'graverobber': { cardId: 'graverobber', count: 10, cards: [] },
            'copper': { cardId: 'copper', count: 10, cards: [] },
            'silver': { cardId: 'silver', count: 10, cards: [] },
            'gold': { cardId: 'gold', count: 10, cards: [] },
            'curse': { cardId: 'curse', count: 10, cards: [] },
        },
        trash: [],
        phase: 'ACTION',
        turnNumber: 1,
        currentPlayerIndex: 0,
        rng: { seed: 'complex-test', callCount: 0 },
        history: [],
        logs: [],
        effectStack: [],
        pendingDecision: null,
        activeEnchantresses: [],
        enchantressAffectedPlayers: [],
        landscapeState: {},
        kingdomCards: [],
        snapshots: []
    } as any;
}

describe('Complex Cards QA', () => {

    it('Procession: Should play action twice, trash it, and gain card +1 cost', () => {
        let state = createMockState();
        const p1 = state.players[0];

        // Setup
        p1.hand = [
            { id: 'procession', instanceId: 'c1' },
            { id: 'village', instanceId: 'c2' }
        ] as any;
        p1.deck = [{ id: 'copper', instanceId: 'd1' }, { id: 'silver', instanceId: 'd2' }] as any;

        // 1. Play Procession
        let result = ActionResolver.resolve(state, 'p1', { type: 'PLAY_CARD', cardInstanceId: 'c1' });
        state = result.state;

        console.log('Procession PendingDecision:', state.pendingDecision);

        // 2. Handle Choice: Select Village
        const decision = state.pendingDecision;
        expect(decision).toBeDefined();
        if (decision) {
            result = ActionResolver.resolve(state, 'p1', {
                type: 'CHOOSE',
                choiceId: decision.id,
                payload: { type: 'CARDS', cardInstanceIds: ['c2'] }
            });
            state = result.state;
        }

        // 3. Verify Effects
        const trashedVillage = state.trash.find(c => c.id === 'village');
        expect(trashedVillage).toBeDefined();

        // 4. Handle Gain Choice
        const gainDecision = state.pendingDecision;
        // console.log('Gain Decision:', gainDecision);
        expect(gainDecision).toBeDefined();

        if (gainDecision) {
            // Select Smithy (Cost 4, Village is 3+1)
            result = ActionResolver.resolve(state, 'p1', {
                type: 'CHOOSE',
                choiceId: gainDecision.id,
                payload: { type: 'SUPPLY', cardId: 'smithy' }
            });
            state = result.state;

            const updatedP1 = state.players[0];
            const gained = updatedP1.discardPile.find(c => c.id === 'smithy');
            expect(gained).toBeDefined();
        }
    });

    it('Enchantress: Should be duration and neutralize attacks', () => {
        let state = createMockState();

        state.players[0].hand = [{ id: 'enchantress', instanceId: 'e1' }] as any;
        state.players[1].hand = [{ id: 'village', instanceId: 'v1' }] as any;

        // 1. Play Enchantress
        let result = ActionResolver.resolve(state, 'p1', { type: 'PLAY_CARD', cardInstanceId: 'e1' });
        state = result.state;

        console.log('Active Enchantresses:', state.activeEnchantresses);

        // Check Duration
        const ench = state.players[0].playArea.find(c => c.id === 'enchantress');
        expect(ench).toBeDefined();

        // End P1 Turn (triggers clean up)
        TurnMachine.endActionPhase(state);
        TurnMachine.endBuyPhase(state);
        TurnMachine.finalizeCleanup(state);

        console.log('After Cleanup Active Enchantresses:', state.activeEnchantresses);
        expect(state.activeEnchantresses).toContain('p1');

        // 2. P2 Plays Village (Neutralized)
        result = ActionResolver.resolve(state, 'p2', { type: 'PLAY_CARD', cardInstanceId: 'v1' });
        state = result.state;

        expect(state.players[1].actions).toBe(1);
    });

    it('Graverobber: Should offer modal choice', () => {
        let state = createMockState();
        const p1 = state.players[0];

        state.trash = [{ id: 'silver', instanceId: 't1' }] as any;
        p1.hand = [
            { id: 'graverobber', instanceId: 'g1' },
            { id: 'village', instanceId: 'v1' }
        ] as any;
        p1.deck = [{ id: 'copper', instanceId: 'd1' }];

        // Play
        let result = ActionResolver.resolve(state, 'p1', { type: 'PLAY_CARD', cardInstanceId: 'g1' });
        state = result.state;

        // Modal Prompt
        let decision = state.pendingDecision;
        expect(decision).toBeDefined();

        // Choose Option 0 (Gain from Trash)
        if (decision) {
            result = ActionResolver.resolve(state, 'p1', {
                type: 'CHOOSE',
                choiceId: decision.id,
                payload: { type: 'OPTION', optionIndex: 0 }
            });
            state = result.state;
        }

        // Check Trash Selection Prompt
        decision = state.pendingDecision;
        // console.log('Graverobber Gain Decision:', decision);
        expect(decision).toBeDefined();

        // Select Silver
        if (decision) {
            result = ActionResolver.resolve(state, 'p1', {
                type: 'CHOOSE',
                choiceId: decision.id,
                payload: { type: 'CARDS', cardInstanceIds: ['t1'] }
            });
            state = result.state;

            const updatedP1 = state.players[0];
            const gainedToDeck = updatedP1.deck.find(c => c.id === 'silver');
            expect(gainedToDeck).toBeDefined();
        }
    });

    it('Caravan Guard: Should react to Attack and play duration out of turn', () => {
        let state = createMockState();
        const p1 = state.players[0]; // Attacker
        const p2 = state.players[1]; // Reactor

        // Setup
        p1.hand = [{ id: 'witch', instanceId: 'w1' }] as any;
        p2.hand = [{ id: 'caravan_guard', instanceId: 'cg1' }] as any;
        p2.deck = [{ id: 'copper', instanceId: 'd1' }] as any;

        // 1. P1 plays Witch (Attack)
        // This triggers Reaction Logic in ActionResolver -> AttackEffectHandler
        let result = ActionResolver.resolve(state, 'p1', { type: 'PLAY_CARD', cardInstanceId: 'w1' });
        state = result.state;

        // 2. Check for Reaction Prompt
        // The AttackEffectHandler should prompt P2 to reveal/play reaction
        // Current implementation: AttackEffectHandler auto-resolves certain reactions or prompts?
        // Let's check if we get a decision.

        // Note: Generic "Reaction" usually prompts to "Reveal" or "Pass".
        // Caravan Guard says "you may play this".

        // Verify P2 has a pending decision
        let decision = state.pendingDecision;

        // Debug
        // console.log('Caravan Guard Decision:', decision);

        // If Reaction is handled via standard "Reveal" prompt first:
        if (decision && decision.type === 'SELECT_CARDS') {
            expect(decision.playerId).toBe('p2');
            // Choose to reveal/play Caravan Guard
            result = ActionResolver.resolve(state, 'p2', {
                type: 'CHOOSE',
                choiceId: decision.id,
                payload: { type: 'CARDS', cardInstanceIds: ['cg1'] }
            });
            state = result.state;
        }

        // 3. Verify Caravan Guard Played
        const cgInPlay = state.players[1].playArea.find(c => c.id === 'caravan_guard');
        expect(cgInPlay).toBeDefined(); // Should be moved to play area

        // Verify Immediate Effects (+1 Card for P2)
        expect(state.players[1].hand.length).toBe(1); // Drawn 1 card (was 1, played, drawn 1 -> 1? No, was 1, played -> 0, draw 1 -> 1)
        // No, wait. Hand was [CG]. Played CG -> Hand []. Draw 1 -> Hand [Copper].
        expect(state.players[1].actions).toBe(2); // +1 Action (start 1 + 1 = 2)

        // 4. Verify Duration Next Turn
        // Finish P1 turn
        TurnMachine.endActionPhase(state);
        TurnMachine.endBuyPhase(state);
        TurnMachine.finalizeCleanup(state); // Clean P1

        // P2's Turn
        expect(state.players[0].id).toBe('p2'); // Should be P2's turn?
        // Wait, mocked state assumes P1 is first. After cleanup, startNextTurn?
        // createMockState sets currentPlayerIndex=0.
        // ActionResolver.startNextTurn should be called.
        // Let's check TurnMachine logic or manually advance.

        // Note: verify_client_state.ts logic might be needed here or just check game state.

        // If Caravan Guard is Duration, it should produce +1 Coin at start of P2's turn.
        // We need to trigger start of P2's turn.
        // If startNextTurn was called, P2 is active.

        expect(state.currentPlayerIndex).toBe(1); // P2
        expect(state.players[1].coins).toBe(1); // +1 Coin from Duration
    });

});
