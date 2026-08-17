
import { describe, test, expect } from 'vitest';
import { TestEngine } from './TestUtils';

describe('Seaside Validation', () => {

    test('Lighthouse (+1 Action, +1 Coin, Duration: +1 Coin next turn)', () => {
        const engine = new TestEngine();
        engine.setHand(['lighthouse']);
        engine.setDeck(['copper']);

        engine.playCard('lighthouse');

        // Immediate effects
        engine.expectState((state, player) => {
            expect(player.actions).toBe(1); // 1 start - 1 played + 1 effect = 1
            expect(player.coins).toBe(1);
            expect(player.playArea).toHaveLength(1);
        });

        // End turn -> Next turn (P2) -> Next turn (P1)
        engine.advanceTurn();
        engine.advanceTurn();

        // Duration effects: +1 Coin
        engine.expectState((state, player) => {
            // Turn start resets coins to 0, then duration adds 1.
            expect(player.coins).toBe(1);
            // Lighthouse should still be in play
            const lighthouse = player.playArea.find((c: any) => c.id === 'lighthouse');
            expect(lighthouse).toBeDefined();
        });

        // Advance again -> Cleanup
        engine.advanceTurn();
        // Since duration passed, it should be discarded in Cleanup of PREVIOUS turn if checked correctly
        // But our simple TestUtils discards if turnPlayed < turnNumber.
        // It stays for one extra turn.
    });

    test('Wharf (+2 Cards, +1 Buy. Duration: +2 Cards, +1 Buy)', () => {
        const engine = new TestEngine();
        engine.setHand(['wharf']);
        const deck = ['copper', 'silver', 'gold', 'estate', 'duchy', 'province', 'copper', 'copper', 'copper', 'copper'];
        engine.setDeck(deck);

        engine.playCard('wharf');

        engine.expectState((state, player) => {
            expect(player.hand).toHaveLength(2); // Drew 2
            expect(player.buys).toBe(2); // 1 start + 1
        });

        engine.advanceTurn();
        engine.advanceTurn();

        engine.expectState((state, player) => {
            // New turn: Drawn 5 (from remaining 8) + 2 Duration = 7
            expect(player.hand).toHaveLength(7);
            expect(player.buys).toBe(2); // 1 start + 1
        });
    });

    test('Fishing Village (+2 Actions, +1 Coin. Duration: +1 Action, +1 Coin)', () => {
        const engine = new TestEngine();
        engine.setHand(['fishing_village']);

        engine.playCard('fishing_village');

        engine.expectState((state, player) => {
            expect(player.actions).toBe(2); // 1 - 1 + 2
            expect(player.coins).toBe(1);
        });

        engine.advanceTurn();
        engine.advanceTurn();

        engine.expectState((state, player) => {
            expect(player.actions).toBe(2); // 1 + 1
            expect(player.coins).toBe(1);
        });
    });

    test('Merchant Ship (+2 Coins. Duration: +2 Coins)', () => {
        const engine = new TestEngine();
        engine.setHand(['merchant_ship']);

        engine.playCard('merchant_ship');
        expect(engine.getPlayer().coins).toBe(2);

        engine.advanceTurn();
        engine.advanceTurn();
        expect(engine.getPlayer().coins).toBe(2);
    });

    test('Caravan (+1 Card, +1 Action. Duration: +1 Card)', () => {
        const engine = new TestEngine();
        engine.setHand(['caravan']);
        const deck = ['copper', 'silver', 'gold', 'estate', 'duchy', 'province', 'copper'];
        engine.setDeck(deck);

        engine.playCard('caravan');

        engine.expectState((state, player) => {
            expect(player.hand).toHaveLength(1);
            expect(player.actions).toBe(1);
        });

        engine.advanceTurn();
        engine.advanceTurn();

        engine.expectState((state, player) => {
            expect(player.hand).toHaveLength(6); // 5 start + 1
        });
    });
});
