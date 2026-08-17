import { describe, it, expect } from 'vitest';
import { TriggerEffectHandler } from '../engine/effects/TriggerEffectHandler.js';
import { GameState, PlayerState } from '../engine/GameState.js';
import { EffectEngine } from '../engine/EffectEngine.js';
import { TurnMachine } from '../engine/TurnMachine.js';
import { EffectManager } from '../engine/EffectManager.js';
import { CardRegistry } from '../cards/index.js';
import { DurationManager } from '../engine/DurationManager.js';

describe('Simultaneous Resolution', () => {
    it('should prompt for ordering Start-of-Turn triggers when multiple exist', () => {
        // 1. Setup State
        const player: PlayerState = {
            id: 'p1',
            name: 'Player 1',
            hand: [],
            deck: [],
            discardPile: [],
            playArea: [],
            actions: 0,
            buys: 0,
            coins: 0,
            projects: ['citadel'], // Project with start-of-turn effect
            triggers: [],
            turnNumber: 0
        } as any;

        const state: GameState = {
            players: [player],
            currentPlayerIndex: -1, // Will be incremented to 0
            effectStack: [],
            phase: 'CLEANUP',
            turnNumber: 0,
            trash: [],
            supply: [],
            durations: []
        } as any;

        // Mock Citadel
        CardRegistry.register({
            id: 'citadel',
            name: 'Citadelle',
            types: ['PROJECT'],
            cost: 8,
            onTurnStart: [{ type: 'ADD_ACTIONS', amount: 1 }]
        });

        // Register a Duration (Wharf)
        CardRegistry.register({
            id: 'wharf',
            name: 'Quai',
            types: ['ACTION', 'DURATION'],
            cost: 5,
            effects: [{ type: 'DRAW', amount: 2 }],
        });

        // Add Active Duration
        DurationManager.register(state, {
            cardInstanceId: 'wharf_inst_1',
            cardId: 'wharf',
            playerId: player.id,
            turnsRemaining: 1,
            effects: [{ type: 'DRAW', amount: 2 }]
        });

        // Force the registration turn to be in the past so it triggers
        if (state.durations && state.durations.length > 0) {
            state.durations[0].registeredOnTurn = -1;
        }

        // 2. Start Turn (Trigger `startNextTurn`)
        // We'll call startNextTurn indirectly or directly?
        // startNextTurn is private in TurnMachine. 
        // We can call finalizeCleanup which calls startNextTurn.
        // Or just expose startNextTurn for testing?
        // Let's use finalizeCleanup.

        // Mock getCurrentPlayer
        state.currentPlayerIndex = 0;

        // finalizeCleanup requires players, etc.
        // It calls startNextTurn.

        // Actually, let's just manually test the logic block from startNextTurn 
        // since startNextTurn is private and hard to isolate without full game loop.

        // Simulate Start Turn triggers manually to verify EffectManager integration
        const triggers = [];

        // 1. Duration Triggers
        const durationTriggers = DurationManager.getStartOfTurnTriggers(state, player);
        triggers.push(...durationTriggers);

        // 2. Project Triggers
        const activeProjects = player.projects || [];
        activeProjects.forEach(pid => {
            const def = CardRegistry.get(pid);
            if (def?.onTurnStart) {
                triggers.push({
                    id: `project_${pid}`,
                    sourceId: pid,
                    sourceType: 'PROJECT',
                    description: `Projet: ${def.name}`,
                    effects: def.onTurnStart
                });
            }
        });

        expect(triggers.length).toBe(2); // Wharf + Citadel

        // 3. Resolve
        EffectManager.resolveTriggers(state, player, triggers, "Test Order");

        // Verify stack has SYSTEM_ORDER_TRIGGERS
        expect(state.effectStack.length).toBe(1);
        const effectItem = state.effectStack[0];
        expect(effectItem.type).toBe('EFFECT');
        expect((effectItem.effect as any).type).toBe('SYSTEM_ORDER_TRIGGERS');

        // 4. Process Stack to get Decision
        const result = EffectEngine.processStack(state);
        expect(result.needsChoice).toBe(true);
        expect((result as any).decision?.type).toBe('SELECT_OPTION');
        expect((result as any).decision?.options?.length).toBe(2);

        // 5. Choose Option 0 (Wharf)
        const decisionResult = EffectEngine.resolveDecision(state, player.id, {
            type: 'OPTION',
            optionIndex: 0
        });

        // Should execute Wharf immediately (DRAW 2) AND push ORDER_TRIGGERS for remaining (Citadel)
        // Execution order: 
        // 1. Wharf Effects (pushed last to execute first)
        // 2. Order Remainder (pushed first to execute last)

        // Stack should contain: [Order(Citadel), ...WharfEffects]
        // processStack inside resolveDecision might process them if they are effects?

        // Actually resolveDecision calls processStack.
        // The Wharf effect is DRAW 2. It will be processed.
        // Then stack will have Order(Citadel).

        // Let's correct expectations:
        // resolveDecision returns final state after processing stack until choice needed.
        // Wharf (Draw 2) needs no choice.
        // Order(Citadel) needs no choice (single item executes immediately).
        // Citadel (Add Action) needs no choice.

        // So resolveDecision should return needsChoice: false and empty stack!
        // Because default simulation processes everything possible.

        expect(decisionResult.needsChoice).toBe(false);
        expect(state.effectStack.length).toBe(0);

        // Effects applied?
        // Verify player state or logs? 
        // We didn't really mocking applyEffects actions fully without context, 
        // but DRAW usually adds to hand. Player.hand was empty. 
        // Note: EffectEngine probably needs full init.
    });
    it('should prompt for ordering On-Buy triggers when multiple exist', () => {
        // 1. Setup State
        const player: PlayerState = {
            id: 'p1',
            name: 'Player 1',
            hand: [],
            deck: [],
            discardPile: [],
            playArea: [],
            actions: 0,
            buys: 1,
            coins: 5,
            projects: [],
            triggers: [],
            turnNumber: 1
        } as any;

        const state: GameState = {
            players: [player],
            currentPlayerIndex: 0,
            effectStack: [],
            phase: 'BUY',
            turnNumber: 1,
            trash: [],
            supply: [],
            durations: []
        } as any;

        // Mock Cards
        CardRegistry.register({
            id: 'gold',
            name: 'Or',
            types: ['TREASURE'],
            cost: 6,
            value: 3
        } as any);

        CardRegistry.register({
            id: 'haggler',
            name: 'Marchander',
            types: ['ACTION'],
            cost: 5,
            onBuyTrigger: { type: 'GAIN_CARD_LESS_THAN_COST', amount: 1 } // Simplified effect type
        } as any);

        // Add 2 Hagglers to Play Area
        player.playArea.push(
            { id: 'haggler', instanceId: 'h1' } as any,
            { id: 'haggler', instanceId: 'h2' } as any
        );

        // 2. Trigger On-Buy
        // We call helper directly to avoid full buy logic
        TriggerEffectHandler.handleOnBuyTriggers(state, player, 'gold');

        // 3. Verify Ordering Prompt
        // Should have SYSTEM_ORDER_TRIGGERS on stack
        expect(state.effectStack.length).toBe(1);
        const effectItem = state.effectStack[0];
        expect((effectItem.effect as any).type).toBe('SYSTEM_ORDER_TRIGGERS');
        expect((effectItem.effect as any).triggers.length).toBe(2);

        // 4. Process Stack
        const result = EffectEngine.processStack(state);
        expect(result.needsChoice).toBe(true);
        expect((result as any).decision?.type).toBe('SELECT_OPTION');
        expect((result as any).decision?.options?.length).toBe(2);
    });
});
