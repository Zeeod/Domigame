
import { describe, test, expect } from 'vitest';
import { TestEngine } from './TestUtils';
import { GameState } from '../../../shared/engine/GameState';
import { PlayerState } from '../../../shared/engine/PlayerState';

describe('Adventures Validation - Part 1', () => {

    test('Amulet (Choice: Money, Trash, or Silver - Now & Next Turn)', () => {
        const engine = new TestEngine();
        engine.setHand(['amulet', 'copper', 'estate']);
        engine.setDeck(new Array(20).fill('copper'));

        // 1. Play Amulet, choose +1 Money
        engine.playCard('amulet');
        engine.chooseOption(0); // +1 Money

        engine.expectState((_state: GameState, player: PlayerState) => {
            expect(player.coins).toBe(1);
            expect(player.playArea.some(c => c.id === 'amulet')).toBe(true);
        });

        // 2. Next turn (Player 2)
        engine.advanceTurn();

        // 3. Back to Player 1's turn
        engine.advanceTurn();
        // Amulet duration triggers choice
        engine.chooseOption(2); // Gain Silver

        engine.expectState((_state: GameState, player: PlayerState) => {
            // New turn: coins reset to 0
            expect(player.coins).toBe(0);
            expect(player.discardPile.some(c => c.id === 'silver')).toBe(true);
        });
    });

    test('Caravan Guard (+1 Card, +1 Action, +1 Money next turn)', () => {
        const engine = new TestEngine();
        engine.setHand(['caravan_guard', 'copper', 'estate']);
        engine.setDeck(new Array(20).fill('copper'));
        // Put a silver on top of deck to be drawn by Caravan Guard
        const p = engine.getPlayer();
        p.deck.unshift({ id: 'silver', instanceId: 's1' } as any);

        engine.playCard('caravan_guard');

        engine.expectState((_state: GameState, player: PlayerState) => {
            expect(player.hand.some(c => c.id === 'silver')).toBe(true);
            expect(player.actions).toBe(1);
            expect(player.hand).toHaveLength(3); // 3 initial - 1 played + 1 drawn
        });

        // Player 2's turn
        engine.advanceTurn();
        // Player 1's Turn 2
        engine.advanceTurn();

        engine.expectState((_state: GameState, player: PlayerState) => {
            expect(player.coins).toBe(1);
        });
    });

    test('Dungeon (+1 Action, Draw 2, Discard 2 - Now & Next Turn)', () => {
        const engine = new TestEngine();
        engine.setHand(['dungeon', 'copper', 'estate']);
        engine.setDeck(['silver', 'gold', 'curse', 'duchy', ...new Array(20).fill('copper')]);

        engine.playCard('dungeon');
        // Initial hand: 3. Draw 2: 5. Play Dungeon: 4.
        const hand = engine.getPlayer().hand;
        const toDiscardNow = hand.filter(c => ['copper', 'estate'].includes(c.id)).map(c => c.instanceId);
        engine.chooseCards(toDiscardNow);

        engine.expectState((_state: GameState, player: PlayerState) => {
            expect(player.actions).toBe(1);
            expect(player.hand).toHaveLength(2); // silver, gold
        });

        // Player 2's turn
        engine.advanceTurn();

        // Player 1's Turn 2
        engine.advanceTurn();
        // Cleanup drew 5. Dungeon draws 2. Total 7 in hand.
        // User must discard 2.
        const handNext = engine.getPlayer().hand;
        engine.chooseCards([handNext[0].instanceId, handNext[1].instanceId]);

        engine.expectState((_state: GameState, player: PlayerState) => {
            expect(player.hand).toHaveLength(5); // 7 - 2 = 5
        });
    });

    test('Gear (+2 Cards, Set Aside 2, Return next turn)', () => {
        const engine = new TestEngine();
        engine.setHand(['gear', 'copper', 'estate']);
        engine.setDeck(['silver', 'gold', 'duchy', 'province', ...new Array(20).fill('copper')]);

        engine.playCard('gear');
        // Initial 3. Play Gear: 2. Draw 2: 4.
        const hand = engine.getPlayer().hand;
        const silver = hand.find(c => c.id === 'silver')!;
        const gold = hand.find(c => c.id === 'gold')!;
        engine.chooseCards([silver.instanceId, gold.instanceId]);

        engine.expectState((_state: GameState, player: PlayerState) => {
            expect(player.hand).toHaveLength(2); // copper, estate
            expect(player.aside).toHaveLength(2); // silver, gold
        });

        // Player 2's turn
        engine.advanceTurn();

        // Player 1's Turn 2
        engine.advanceTurn();

        engine.expectState((_state: GameState, player: PlayerState) => {
            // New turn: 5 cards (default draw) + 2 returned from Gear = 7
            expect(player.hand).toHaveLength(7);
            expect(player.hand.some(c => c.id === 'silver')).toBe(true);
        });
    });

    test('Guide (+1 Card, +1 Action, Tavern Mat)', () => {
        const engine = new TestEngine();
        engine.setHand(['guide', 'copper', 'estate']);
        engine.setDeck(new Array(20).fill('copper'));

        engine.playCard('guide');

        engine.expectState((_state: GameState, player: PlayerState) => {
            expect(player.actions).toBe(1);
            expect(player.hand).toHaveLength(3); // 3-1+1 = 3
            expect(player.tavernMat.some(c => c.id === 'guide')).toBe(true);
        });
    });

    test('Hireling (Permanent Duration: +1 Card each turn)', () => {
        const engine = new TestEngine();
        engine.setHand(['hireling', 'copper', 'estate']);
        engine.setDeck(new Array(30).fill('copper'));

        engine.playCard('hireling');

        // Advance 2 turns
        engine.advanceTurn();
        engine.advanceTurn();

        engine.expectState((_state: GameState, player: PlayerState) => {
            // New turn: 5 + 1 from Hireling = 6
            expect(player.hand).toHaveLength(6);
        });

        // Advance 2 more turns
        engine.advanceTurn();
        engine.advanceTurn();

        engine.expectState((_state: GameState, player: PlayerState) => {
            // Still +1 Card: 6
            expect(player.hand).toHaveLength(6);
        });
    });

    test('Lost City (Draw 2, Actions 2, OnGain: Others Draw 1)', () => {
        const engine = new TestEngine();
        const p1 = engine.getPlayer('Player1');
        const p2 = engine.getPlayer('Player2');
        engine.setDeck(p1, new Array(20).fill('copper'));
        engine.setDeck(p2, new Array(20).fill('copper'));
        engine.setHand(p2, new Array(5).fill('copper'));

        engine.setHand(p1, ['lost_city', 'copper', 'estate']);
        engine.playCard('lost_city');
        engine.expectState((_state: GameState, player: PlayerState) => {
            expect(player.actions).toBe(2);
            expect(player.hand).toHaveLength(4); // 3-1+2 = 4
        });

        // Test OnGain for other player
        engine.gainCard('lost_city');
        expect(p2.hand).toHaveLength(6); // 5 + 1
    });

    test('Magpie (+1 Card, +1 Action, Reveal Treasure -> Hand)', () => {
        const engine = new TestEngine();
        engine.setHand(['magpie', 'copper', 'estate']);
        engine.setDeck(['estate', 'silver', ...new Array(20).fill('copper')]);

        engine.playCard('magpie');

        engine.expectState((_state: GameState, player: PlayerState) => {
            expect(player.actions).toBe(1);
            expect(player.hand).toHaveLength(4); // 3 initial - 1 played + 1 (draw) + 1 (reveal treasure) = 4
            expect(player.hand.some(c => c.id === 'silver')).toBe(true);
        });
    });

    test('Magpie (+1 Card, +1 Action, Reveal Action -> Gain Magpie)', () => {
        const engine = new TestEngine();
        engine.setHand(['magpie', 'copper', 'estate']);
        engine.setDeck(['copper', 'magpie', ...new Array(20).fill('copper')]);

        engine.playCard('magpie');

        engine.expectState((_state: GameState, player: PlayerState) => {
            expect(player.actions).toBe(1);
            expect(player.hand).toHaveLength(3); // 3-1+1 = 3
            expect(player.discardPile.some(c => c.id === 'magpie')).toBe(true);
        });
    });

    test('Messenger (+1 Buy, +2 Money, Deck to Discard)', () => {
        const engine = new TestEngine();
        engine.setHand(['messenger', 'copper', 'estate']);
        engine.setDeck(['silver', 'gold', ...new Array(20).fill('copper')]);

        engine.playCard('messenger');
        engine.chooseOption(0); // Yes, discard deck

        engine.expectState((_state: GameState, player: PlayerState) => {
            expect(player.coins).toBe(2);
            expect(player.buys).toBe(2);
            expect(player.deck).toHaveLength(0);
            expect(player.discardPile.some(c => c.id === 'silver')).toBe(true);
        });
    });

    test('Miser (Choice: Put copper on Tavern)', () => {
        const engine = new TestEngine();
        engine.setHand(['miser', 'copper']);
        engine.setDeck(new Array(20).fill('copper'));

        engine.playCard('miser');
        engine.chooseOption(0); // Put copper on Tavern

        engine.expectState((_state: GameState, player: PlayerState) => {
            expect(player.tavernMat.some(c => c.id === 'copper')).toBe(true);
            expect(player.hand.some(c => c.id === 'copper')).toBe(false);
        });
    });

    test('Miser (Choice: +Money per copper on Tavern)', () => {
        const engine = new TestEngine();
        engine.setHand(['miser']);
        engine.setDeck(new Array(20).fill('copper'));
        // Manually put 2 coppers on tavern
        const p1 = engine.getPlayer();
        p1.tavernMat.push({ id: 'copper', instanceId: 'c1' } as any, { id: 'copper', instanceId: 'c2' } as any);

        engine.playCard('miser');
        engine.chooseOption(1); // +1 Money per copper on tavern mat

        engine.expectState((_state: GameState, player: PlayerState) => {
            expect(player.coins).toBe(2);
        });
    });

});
