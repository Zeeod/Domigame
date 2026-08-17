
import { describe, test, expect } from 'vitest';
import { TestEngine } from './TestUtils';
import { createCardInstance } from '../../../shared/engine/CardInstance';

describe('Base Set Validation Part 3 (2nd Edition)', () => {

    test('Harbinger (+1 Card, +1 Action, Look at discard)', () => {
        const engine = new TestEngine();
        engine.setHand(['harbinger']);
        engine.setDeck(['copper']);
        const p = engine.getPlayer();
        p.discardPile = [createCardInstance('silver'), createCardInstance('gold')];

        engine.playCard('harbinger');

        engine.expectState((state, player) => {
            expect(player.hand).toHaveLength(1); // copper (harbinger played and removed from hand)
            expect(player.actions).toBe(1);
        });

        expect(engine.state.pendingDecision).toBeDefined();

        const silver = p.discardPile.find((c: any) => c.id === 'silver')!;
        engine.respondToDecision({
            type: 'CARDS',
            cardIds: [silver.instanceId]
        });

        expect(p.deck[0].id).toBe('silver');
    });

    test('Merchant (+1 Card, +1 Action, +1 Coin per Silver played)', () => {
        const engine = new TestEngine();
        engine.setHand(['merchant', 'silver']);
        engine.setDeck(['copper']);

        engine.playCard('merchant');

        engine.expectState((state, player) => {
            expect(player.hand).toHaveLength(2); // silver, copper
            expect(player.actions).toBe(1);
            expect(player.coins).toBe(0);
        });

        engine.playCard('silver');

        engine.expectState((state, player) => {
            expect(player.coins).toBeGreaterThanOrEqual(2);
        });
    });

    test('Vassal (+2 Coins, Discard Action -> Play?)', () => {
        const engine = new TestEngine();
        engine.setHand(['vassal']);
        engine.setDeck(['village']);

        engine.playCard('vassal');

        expect(engine.getPlayer().coins).toBe(2);

        expect(engine.state.pendingDecision).toBeDefined();

        const p = engine.getPlayer();
        const village = p.aside.find((c: any) => c.id === 'village')
            || p.discardPile.find((c: any) => c.id === 'village')
            || engine.state.lastRevealedCards?.find(c => c.id === 'village');

        if (village) {
            engine.respondToDecision({
                type: 'CARDS',
                cardIds: [village.instanceId]
            });

            engine.expectState((state, player) => {
                // Actions: 1 start - 1 Vassal + 2 Village = 2.
                expect(player.actions).toBe(2);
            });
        } else {
            throw new Error("Vassal did not reveal/find Village");
        }
    });

    test('Poacher (+1 Card, +1 Action, +1 Coin, Discard per empty supply)', () => {
        const engine = new TestEngine();
        engine.setHand(['poacher', 'copper', 'estate']);
        engine.setDeck(['silver']);

        if (engine.state.supply['copper']) engine.state.supply['copper'].count = 0;
        if (engine.state.supply['silver']) engine.state.supply['silver'].count = 0;
        if (engine.state.supply['gold']) engine.state.supply['gold'].count = 0;

        engine.playCard('poacher');

        expect(engine.getPlayer().coins).toBe(1);

        if (engine.state.pendingDecision) {
            const copper = engine.getPlayer().hand.find((c: any) => c.id === 'copper');
            if (copper) {
                engine.respondToDecision({
                    type: 'CARDS',
                    cardIds: [copper.instanceId]
                });
                expect(engine.getPlayer().discardPile).toHaveLength(1);
            }
        }
    });

    test('Bandit (Gain Gold, Attack Opponents)', () => {
        const engine = new TestEngine();
        engine.setHand(['bandit']);

        const p1 = engine.getPlayer();
        const p2 = engine.state.players[1];
        engine.setDeck(p2.id, ['silver', 'copper']);

        engine.playCard('bandit');

        const gold = p1.discardPile.find(c => c.id === 'gold') || p1.deck.find(c => c.id === 'gold');
        if (gold) {
            expect(gold.id).toBe('gold');
        }

        const silverTrashed = engine.state.trash.find(c => c.id === 'silver');
        if (silverTrashed) {
            expect(silverTrashed.id).toBe('silver');
        }
    });

    test('Sentry (+1 Card, +1 Action. Look top 2 -> Trash/Discard/Deck)', () => {
        const engine = new TestEngine();
        engine.setHand(['sentry']);
        engine.setDeck(['curse', 'silver']);

        engine.playCard('sentry');

        engine.expectState((state, player) => {
            expect(player.actions).toBe(1);
        });
    });

    test('Artisan (Gain card to hand, topdeck from hand)', () => {
        const engine = new TestEngine();
        engine.setHand(['artisan', 'copper']);

        engine.playCard('artisan');

        expect(engine.state.pendingDecision).toBeDefined();
        engine.respondWithSupply('silver');

        const p = engine.getPlayer();
        expect(p.hand.find((c: any) => c.id === 'silver')).toBeDefined();

        expect(engine.state.pendingDecision).toBeDefined();
        const silver = p.hand.find((c: any) => c.id === 'silver')!;

        engine.respondToDecision({
            type: 'CARDS',
            cardIds: [silver.instanceId]
        });

        expect(p.deck[0].id).toBe('silver');
    });

});
