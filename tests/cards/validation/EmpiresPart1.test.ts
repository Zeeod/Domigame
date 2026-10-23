
import { describe, test, expect } from 'vitest';
import { TestEngine } from '../../helpers/TestUtils.js';

describe('Empires Validation - Part 1', () => {
    // Archive (Draw 3: see tests/cards/empires/Empires.test.ts

    // Capital (+6: see tests/cards/empires/Empires.test.ts

    // Catapult / Rocks: see tests/cards/empires/Empires.test.ts

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

    // City Quarter (+2: see tests/cards/empires/Empires.test.ts

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

    // Gladiator / Fortune: see tests/cards/empires/Empires.test.ts

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
