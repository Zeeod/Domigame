
import { describe, test, expect } from 'vitest';
import { TestEngine } from './TestUtils.js';

describe('Empires Validation - Part 1', () => {
    test('Archive (Draw 3, set aside, take 1 each turn)', () => {
        const engine = new TestEngine();
        engine.setHand(['archive', 'copper', 'estate']);
        engine.setDeck(['silver', 'gold', 'duchy', 'province', 'curse']);

        engine.playCard('archive');
        engine.handleChoice('silver'); // Put silver in hand

        // Archive: Draw 3, put 1 in hand, set aside 2.
        engine.expectState((_state, player) => {
            expect(player.hand).toHaveLength(3); // copper, estate, silver
            expect(player.aside).toHaveLength(2); // gold, duchy
        });
    });

    test('Capital (+6 Coins, +2 Buys, Debt on cleanup)', () => {
        const engine = new TestEngine();
        engine.setHand(['capital', 'copper']);

        engine.playCard('capital');
        engine.expectState((_state, player) => {
            expect(player.coins).toBe(6);
            expect(player.buys).toBe(1 + 1);
        });

        engine.advanceTurn();
        // Capital: "When you discard this from play, +6 Debt..."
        engine.expectState((state, _player) => {
            // After cleanup, player1 should have 6 debt (wait, it's Player2 turn now in TestUtils)
            const p1 = state.players.find(p => p.name === 'Player 1')!;
            expect(p1.debt).toBe(6);
        });
    });

    test('Catapult / Rocks (Attack effects)', () => {
        const engine = new TestEngine();
        const p1 = engine.getPlayer('Player1');
        const p2 = engine.getPlayer('Player2');
        engine.setHand(p1, ['catapult', 'silver']);
        engine.setHand(p2, ['copper', 'estate', 'duchy', 'province', 'curse']);

        engine.playCard('catapult');
        // Player 1 chooses silver to trash (Cost 3, Treasure)
        engine.handleChoice('silver');

        engine.expectState((_state, _player) => {
            // Silver costs 3 -> P2 gains Curse
            // Silver is Treasure -> P2 discards to 3
            expect(p2.discardPile.some(c => c.id === 'curse')).toBe(true);
            expect(p2.hand).toHaveLength(3);
        });
    });

    test('Chariot Race (Comparison)', () => {
        const engine = new TestEngine();
        const p1 = engine.getPlayer('Player1');
        const p2 = engine.getPlayer('Player2');

        engine.setHand(p1, ['chariot_race']);
        engine.setDeck(p1, ['gold']);
        engine.setDeck(p2, ['copper']);

        engine.playCard('chariot_race');
        // Both reveal. P1: Gold (6), P2: Copper (0).
        // P1 wins: +1 VP, +1 Coin.
        engine.expectState((_state, player) => {
            expect(player.coins).toBe(1);
            expect(player.vpTokens).toBe(1);
        });
    });

    test('City Quarter (+2 Actions, Draw per action in play)', () => {
        const engine = new TestEngine();
        engine.setHand(['city_quarter', 'village', 'village', 'copper', 'estate']);
        engine.setDeck(['silver', 'gold', 'duchy', 'province', 'curse']);

        engine.playCard('village');
        engine.playCard('village');
        // 2 villages in play
        engine.playCard('city_quarter');
        // +2 Actions. Draw 1 per Action in play.
        // In play: village, village, city_quarter (3 actions)
        engine.expectState((_state, player) => {
            // village 1: actions=2
            // village 2: actions=2-1+2 = 3
            // city_quarter: actions=3-1+2 = 4
            expect(player.actions).toBe(4);
            // hand starts with 5.
            // play village 1: hand=4, draw 1 = 5
            // play village 2: hand=4, draw 1 = 5
            // play city_quarter: hand=4, draw 3 = 7
            expect(player.hand).toHaveLength(7);
        });
    });

    test('Crown (Action Doubling)', () => {
        const engine = new TestEngine();
        engine.setHand(['crown', 'smithy']);
        engine.setDeck(['copper', 'copper', 'copper', 'estate', 'estate', 'estate']);
        engine.playCard('crown');
        // Doubling smithy
        engine.handleChoice('smithy');
        engine.expectState((_state, player) => {
            // Smithy played twice: 3x2 = 6 cards. 
            // Hand started at 2 (crown, smithy). Play crown=1. Smithy moved from hand to play by Crown. Draw 6=6.
            expect(player.hand).toHaveLength(6);
        });
    });

    test('Enchantress (Duration Attack)', () => {
        const engine = new TestEngine();
        const p1 = engine.getPlayer('Player1');
        const p2 = engine.getPlayer('Player2');

        engine.setHand(p1, ['enchantress']);
        engine.playCard('enchantress');

        engine.advanceTurn(); // Player 2 turn
        engine.setDeck(p2, ['copper', 'copper']);
        engine.setHand(p2, ['smithy']);
        // Smithy is first action played
        engine.playCard('smithy');

        engine.expectState((_state, player) => {
            // Smithy replaced by: +1 Card, +1 Action
            // Hand was 1 (smithy), played smithy = 0. Draw 1 = 1.
            expect(player.hand).toHaveLength(1);
            expect(player.actions).toBe(1);
        });
    });

    test('Engineer (Gain card 4 coins / trash self)', () => {
        const engine = new TestEngine();
        engine.setHand(['engineer']);
        engine.playCard('engineer');

        // Choice 1: Gain card (e.g. silver)
        engine.handleChoice('silver');
        // Choice 2: Trash self to gain card?
        engine.handleChoice('Ecarter'); // Option to trash self
        // Choice 3: Gain second card
        engine.handleChoice('village');

        engine.expectState((_state, player) => {
            expect(player.discardPile.some(c => c.id === 'silver')).toBe(true);
            expect(player.discardPile.some(c => c.id === 'village')).toBe(true);
            expect(player.playArea.some(c => c.id === 'engineer')).toBe(false);
        });
    });

    test('Farmers Market (VP on pile)', () => {
        const engine = new TestEngine();
        engine.setHand(['farmers_market']);
        // 1st play: +1 Buy, +1 Money (no tokens on pile yet)
        engine.playCard('farmers_market');
        engine.expectState((_state, player) => {
            expect(player.coins).toBe(1);
        });

        // Setup tokens on pile
        if (!engine.state.supply['farmers_market'].tokens) engine.state.supply['farmers_market'].tokens = {};
        engine.state.supply['farmers_market'].tokens!['vp'] = 4;
        engine.setHand(['farmers_market']);
        engine.playCard('farmers_market');
        // Should take the 4 tokens
        engine.expectState((_state, player) => {
            expect(player.vpTokens).toBe(4);
            expect(engine.state.supply['farmers_market'].tokens!['vp']).toBe(0);
        });
    });

    test('Forum (+3 Cards, +1 Action, Discard 2)', () => {
        const engine = new TestEngine();
        engine.setHand(['forum', 'copper', 'copper', 'estate', 'estate']);
        engine.setDeck(['silver', 'gold', 'duchy']);
        engine.playCard('forum');
        // +3 cards, +1 Action. Then discard 2.
        const p1 = engine.getPlayer('Player1');
        // hand starts at 5. play forum=4. draw 3=7. discard 2=5.
        // We discard the 2 coppers. Find instance IDs.
        const coppers = p1.hand.filter(c => c.id === 'copper').map(c => c.instanceId).slice(0, 2);
        engine.handleChoice(coppers);

        engine.expectState((_state, player) => {
            expect(player.hand).toHaveLength(5);
        });
    });

    test('Gladiator / Fortune (Split Pile)', () => {
        const engine = new TestEngine();
        const p1 = engine.getPlayer('Player1');
        const p2 = engine.getPlayer('Player2');

        engine.setHand(p1, ['gladiator', 'gold']);
        engine.setHand(p2, ['copper']);

        engine.playCard('gladiator');
        // P1 reveals gold
        engine.handleChoice('gold');
        // P2 fails to reveal gold
        engine.expectState((_state, player) => {
            expect(player.coins).toBe(2 + 1); // 2 + 1 bonus
        });
    });

    test('Groundskeeper (VP on gain Victory)', () => {
        const engine = new TestEngine();
        engine.setHand(['groundskeeper', 'copper', 'copper', 'copper']);
        engine.playCard('groundskeeper');

        engine.gainCard('estate');
        engine.expectState((_state, player) => {
            expect(player.vpTokens).toBe(1);
        });
    });
});
