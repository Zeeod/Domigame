
import { describe, it, expect, beforeEach } from 'vitest';
import { createGameState, GameState } from '../../shared/engine/GameState.js';
import { createPlayerState } from '../../shared/engine/PlayerState.js';
import { EffectEngine } from '../../shared/engine/EffectEngine.js';
import { CardRegistry } from '../../shared/cards/index.js';
import { createCardInstance, createCardInstances } from '../../shared/engine/CardInstance.js';
import { PromptType } from '../../shared/engine/prompts/Prompt.js';

describe('Seaside Duration Mechanics', () => {
    let state: GameState;
    let p1: any;

    beforeEach(() => {
        state = createGameState('test_game_seaside');
        p1 = createPlayerState('p1', 'Player 1', '#fff');
        state.players.push(p1);
        state.currentPlayerIndex = 0;
        state.turnNumber = 1;

        // Ensure supply exists
        state.supply = {
            'copper': { count: 60, cardId: 'copper' },
            'estate': { count: 10, cardId: 'estate' }
        } as any;
    });

    describe('Wharf (Quai)', () => {
        it('should give +2 Cards, +1 Buy now and at start of next turn', () => {
            const wharf = createCardInstance('wharf');
            p1.hand = [wharf];
            p1.deck = createCardInstances('copper', 10);
            p1.actions = 1;
            p1.buys = 1;

            // 1. Play Wharf
            const wharfDef = CardRegistry.get('wharf')!;
            EffectEngine.applyEffects(state, p1.id, wharfDef.effects!, false, wharf.instanceId);

            // Immediate effects
            // Wharf is NOT automatically moved to playArea in this unit test flow, so it's still in hand
            expect(p1.hand.length).toBe(3); // Drew 2 + 1 Wharf in hand
            expect(p1.buys).toBe(2); // +1 Buy

            // Move to Play explicitly (ActionResolver usually does this)
            p1.playArea.push(wharf);
            p1.hand = []; // Clear hand for clarity

            // 2. End Turn (Simulate Cleanup)
            // Duration cards stay in play if they have duration effects
            // We verify EffectEngine.cleanup logic separately or simulate it
            // For this test, we assume the card stays in play (mocking cleanup outcome)
            // In a real game, 'cleanup' checks 'hasDurationEffect'

            // 3. Start Next Turn
            state.turnNumber++;
            p1.actions = 1;
            p1.buys = 1;

            // Trigger Duration effects
            // We need to look for cards in playArea with 'durationEffects'
            const durationCards = p1.playArea.filter((c: any) => {
                const def = CardRegistry.get(c.id);
                return def?.types.includes('DURATION');
            });

            durationCards.forEach((c: any) => {
                const def = CardRegistry.get(c.id);
                if (def?.durationEffects) {
                    EffectEngine.applyEffects(state, p1.id, def.durationEffects);
                }
            });

            // Verify Next Turn Effects
            expect(p1.hand.length).toBe(2); // +2 Cards
            expect(p1.buys).toBe(2); // +1 Buy
        });
    });

    describe('Fishing Village (Village de Pêcheurs)', () => {
        it('should give +2 Actions, +1 Coin now and +1 Action, +1 Coin next turn', () => {
            const fv = createCardInstance('fishing_village');
            p1.hand = [fv];
            p1.actions = 1;
            p1.coins = 0;

            // 1. Play
            const def = CardRegistry.get('fishing_village')!;
            EffectEngine.applyEffects(state, p1.id, def.effects!, false, fv.instanceId);

            // Immediate
            expect(p1.actions).toBe(3); // 1 + 2
            expect(p1.coins).toBe(1);

            // Move to play
            p1.playArea.push(fv);

            // 2. Next Turn
            state.turnNumber++;
            p1.actions = 1; // Reset
            p1.coins = 0;   // Reset

            // Apply Duration
            EffectEngine.applyEffects(state, p1.id, def.durationEffects!);

            // Duration Outcome
            expect(p1.actions).toBe(2); // 1 + 1
            expect(p1.coins).toBe(1);
        });
    });

    describe('Tactician (Tacticien)', () => {
        it('should discard hand and give huge bonus next turn', () => {
            const tactician = createCardInstance('tactician');
            p1.hand = [tactician, createCardInstance('copper'), createCardInstance('estate')];
            p1.deck = createCardInstances('copper', 10);
            p1.actions = 1;

            // 1. Play Tactician
            const def = CardRegistry.get('tactician')!;
            EffectEngine.applyEffects(state, p1.id, def.effects!, false, tactician.instanceId);

            // Should see a log or state change?
            // Tactician usually stays in play until next turn
            p1.playArea.push(tactician);

            // Check Hand Discarded
            // Tactician effect is "Discard hand. If you discarded at least one card..."
            // But implementation might be CHOOSE_CARDS/ALL
            expect(p1.hand.length).toBe(0); // Should be empty

            // 2. Next Turn
            state.turnNumber++;
            p1.actions = 1;
            p1.buys = 1;
            p1.hand = []; // Start fresh

            // Apply Duration
            if (def.durationEffects) {
                EffectEngine.applyEffects(state, p1.id, def.durationEffects);
            }

            // Verify Bonus
            expect(p1.hand.length).toBe(5); // +5 Cards
            expect(p1.buys).toBe(2); // +1 Buy
            expect(p1.actions).toBe(2); // +1 Action
        });
    });

    describe('Haven (Havre)', () => {
        it('should set aside a card and return it next turn', () => {
            const haven = createCardInstance('haven');
            const gold = createCardInstance('gold');
            p1.hand = [haven, gold];

            // 1. Play Haven
            const def = CardRegistry.get('haven')!;
            EffectEngine.applyEffects(state, p1.id, def.effects!, false, haven.instanceId);

            // Prompt to set aside
            expect(state.pendingDecision).toBeDefined();
            expect(state.pendingDecision?.context.specialAction).toBe('SET_ASIDE_LINKED');

            // Move Haven to Play Area BEFORE resolving decision, because the engine looks for it there check setAsideLinked logic
            p1.hand = p1.hand.filter((c: any) => c.instanceId !== haven.instanceId);
            p1.playArea.push(haven);

            // Select Gold
            EffectEngine.resolveDecision(state, p1.id, { cardInstanceIds: [gold.instanceId] });

            // Verify Set Aside (Linked to Haven in Play)
            // p1.playArea.push(haven); // Moved up
            expect(haven.linkedCards).toHaveLength(1);
            expect(haven.linkedCards![0].id).toBe('gold');
            expect(p1.hand.length).toBe(0);

            // 2. Next Turn
            state.turnNumber++;
            p1.hand = []; // Empty hand

            // Apply Duration
            // Haven's duration effect is usually "Return linked cards to hand"
            if (def.durationEffects) {
                // We need to pass the sourceCardInstanceId for it to find the linked cards
                EffectEngine.applyEffects(state, p1.id, def.durationEffects, false, haven.instanceId);
            }

            // Verify Return
            expect(p1.hand.length).toBe(1);
            expect(p1.hand[0].id).toBe('gold');
            expect(haven.linkedCards).toHaveLength(0);
        });
    });
});
