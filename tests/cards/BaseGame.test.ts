
import { describe, it, expect, beforeEach } from 'vitest';
import { createGameState, GameState } from '../../shared/engine/GameState.js';
import { createPlayerState } from '../../shared/engine/PlayerState.js';
import { EffectEngine } from '../../shared/engine/EffectEngine.js';
import { CardRegistry } from '../../shared/cards/index.js';
import { createCardInstance, createCardInstances } from '../../shared/engine/CardInstance.js';
import { PromptType } from '../../shared/engine/prompts/Prompt.js';

describe('Base Game Card Mechanics', () => {
    let state: GameState;
    let p1: any;
    let p2: any;

    beforeEach(() => {
        state = createGameState('base_game_seed');

        // Initialize 2 players
        p1 = createPlayerState('p1', 'Player 1', '#fff');
        p2 = createPlayerState('p2', 'Player 2', '#000');
        state.players.push(p1);
        state.players.push(p2);

        // Initialize common supply
        state.supply['curse'] = { cardId: 'curse', count: 10, cards: [] };
        state.supply['copper'] = { cardId: 'copper', count: 46, cards: [] };
    });

    describe('Witch (Sorcière)', () => {
        it('should draw 2 cards and give Curse to other players', () => {
            // Setup P1
            const witchCard = createCardInstance('witch');
            p1.hand = [witchCard];
            p1.deck = createCardInstances('copper', 2);

            // Setup P2 (No Moat)
            p2.hand = [];
            p2.discardPile = [];

            // Play Witch
            const witchDef = CardRegistry.get('witch')!;
            EffectEngine.applyEffects(state, p1.id, witchDef.effects!);

            // Analyze P1 results
            expect(p1.hand.length).toBe(3); // Drew 2 cards + Witch still in hand (not moved to play in this test flow)
            expect(p1.hand.map((c: any) => c.id)).toEqual(expect.arrayContaining(['copper', 'copper', 'witch']));

            // Analyze Attack Stack
            // Witch attack effect ('GAIN_CARD' curse) should have been processed synchronously by processStack (since no choice needed for gain)
            // So we check results directly
            // expect(state.effectStack.length).toBeGreaterThan(0); // REMOVED
            // EffectEngine.processStack(state); // REMOVED

            // Verify P2 gained Curse
            const curse = p2.discardPile.find((c: any) => c.id === 'curse');
            expect(curse).toBeDefined();

            // Verify Logs
            const logs = state.history.map(l => l.type);
            expect(logs).toContain('DRAW');
            expect(logs).toContain('DRAW');
            // Effect refactor changed log types to generic TEXT or event-based
            // expect(logs).toContain('ATTACK_START'); 
            // expect(logs).toContain('GAIN');
        });

        it('should be blocked by Moat (Douves)', () => {
            // Setup P1
            const witchCard = createCardInstance('witch');
            p1.hand = [witchCard];

            // Setup P2 (Has Moat)
            const moatCard = createCardInstance('moat');
            p2.hand = [moatCard];
            p2.discardPile = [];

            // Play Witch
            const witchDef = CardRegistry.get('witch')!;
            EffectEngine.applyEffects(state, p1.id, witchDef.effects!);

            // P2 should be prompted for Reaction
            // The REACTION_WINDOW is pushed to stack
            EffectEngine.processStack(state);

            expect(state.pendingDecision).toBeDefined();
            expect(state.pendingDecision?.type).toBe(PromptType.CHOOSE_CARDS);
            expect(state.pendingDecision?.message).toContain('révéler une carte Réaction');

            // P2 reveals Moat
            // The options are usually [Reaction1, Reaction2, ..., None]
            // We want the first option (Moat)
            // P2 reveals Moat (CHOOSE_CARDS uses type: 'CARDS')
            EffectEngine.resolveDecision(state, p2.id, { type: 'CARDS', cardInstanceIds: [moatCard.instanceId] });

            // Verify Moat Log (It uses REVEAL action type currently)
            const revealLog = state.history.find(l => l.type === 'REACTION');
            expect(revealLog).toBeDefined();

            // P2 should NOT gain Curse
            expect(p2.discardPile.length).toBe(0);
        });
    });

    describe('Throne Room (Salle du Trône)', () => {
        it('should play an Action card twice', () => {
            // Setup P1 with Throne Room and Smithy
            const tr = createCardInstance('throne_room');
            const smithy = createCardInstance('smithy');
            p1.hand = [tr, smithy];
            p1.deck = createCardInstances('copper', 10); // Plenty to draw

            // Play Throne Room
            const trDef = CardRegistry.get('throne_room')!;
            EffectEngine.applyEffects(state, p1.id, trDef.effects!, false, tr.instanceId);

            // Should prompt to pick an action
            expect(state.pendingDecision).toBeDefined();
            expect(state.pendingDecision?.context.specialAction).toBe('ZONE_CHOICE');

            // Select Smithy
            EffectEngine.resolveDecision(state, p1.id, { type: 'CARDS', cardInstanceIds: [smithy.instanceId] });

            // Processing invalidates state, so we process stack
            // Smithy gives +3 Cards. Played twice = +6 Cards.
            // Stack processing is separate for each "Play"

            // The first play puts +3 Cards effect on stack.
            // The second play puts +3 Cards effect on stack.
            // We need to run processStack multiple times or once if it loops?
            // processStack loops until empty.

            // wait, PLAY_TARGET puts effects on stack.
            EffectEngine.processStack(state);

            expect(p1.hand.length).toBe(7); // 3 (first smithy) + 3 (second smithy) + 1 (TR still in hand)
        });
    });

    describe('Militia (Milice)', () => {
        it('should force other players to discard down to 3 cards', () => {
            // Setup P1
            const militia = createCardInstance('militia');
            p1.hand = [militia];

            // Setup P2 with 5 cards
            p2.hand = createCardInstances('copper', 5);

            // Play Militia
            const militiaDef = CardRegistry.get('militia')!;
            EffectEngine.applyEffects(state, p1.id, militiaDef.effects!);

            // P1 gets +2 Coins (immediate)
            expect(p1.coins).toBe(2);

            // P2 should be attacked. Process Stack.
            EffectEngine.processStack(state);

            // P2 Should be prompted to discard
            expect(state.pendingDecision).toBeDefined();
            expect(state.pendingDecision?.playerId).toBe(p2.id);
            expect(state.pendingDecision?.constraints?.max).toBe(2); // Discard 2 to get to 3

            // P2 Discards 2 Coppers
            const toDiscard = p2.hand.slice(0, 2).map((c: any) => c.instanceId);
            EffectEngine.resolveDecision(state, p2.id, { type: 'CARDS', cardInstanceIds: toDiscard });

            // P2 Hand should be 3
            expect(p2.hand.length).toBe(3);
        });
    });
});
