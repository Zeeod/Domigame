
import { describe, test, expect } from 'vitest';
import { TestEngine } from './TestUtils';

describe('Base Set Validation Part 2', () => {

    test('Moat (+2 Cards)', () => {
        const engine = new TestEngine();
        engine.setHand(['moat']);
        engine.setDeck(['copper', 'silver']);

        engine.playCard('moat');

        engine.expectState((state, player) => {
            expect(player.hand).toHaveLength(2);
        });
    });

    test('Bureaucrat (Gain Silver to Deck, Attack)', () => {
        const engine = new TestEngine();
        engine.setHand(['bureaucrat']);

        const p1 = engine.getPlayer();
        const p2 = engine.state.players[1];
        engine.setHand(p2.id, ['estate', 'copper', 'copper', 'copper', 'copper']);

        engine.playCard('bureaucrat');

        engine.expectState((state, player) => {
            const silverOnDeck = player.deck[0];
            expect(silverOnDeck).toBeDefined();
            expect(silverOnDeck.id).toBe('silver');
        });

        expect(engine.state.pendingDecision).toBeDefined();
        const estate = p2.hand.find((c: any) => c.id === 'estate')!;
        engine.respondToDecision({
            type: 'CARDS',
            cardIds: [estate.instanceId]
        });

        const p2Deck = engine.getPlayer(p2.id).deck;
        expect(p2Deck[0].id).toBe('estate');
    });

    test('Remodel (Trash card, Gain card up to +2)', () => {
        const engine = new TestEngine();
        engine.setHand(['remodel', 'estate']);

        engine.playCard('remodel');

        expect(engine.state.pendingDecision).toBeDefined();
        const p = engine.getPlayer();
        const estate = p.hand.find((c: any) => c.id === 'estate')!;
        engine.respondToDecision({
            type: 'CARDS',
            cardIds: [estate.instanceId]
        });

        expect(engine.state.pendingDecision).toBeDefined();
        engine.respondWithSupply('smithy');

        expect(p.discardPile[0].id).toBe('smithy');
        expect(engine.state.trash.find(c => c.id === 'estate')).toBeDefined();
    });

    test('Throne Room (Play Action twice)', () => {
        const engine = new TestEngine();
        engine.setHand(['throne_room', 'market']);
        engine.setDeck(['copper', 'silver']);

        engine.playCard('throne_room');

        expect(engine.state.pendingDecision).toBeDefined();
        const p = engine.getPlayer();
        const market = p.hand.find((c: any) => c.id === 'market')!;

        engine.respondToDecision({
            type: 'CARDS',
            cardIds: [market.instanceId]
        });

        engine.expectState((state, player) => {
            expect(player.hand).toHaveLength(2);
            expect(player.actions).toBe(2);
            expect(player.buys).toBe(3);
            expect(player.coins).toBe(2);
        });

        engine.expectLog('joue');
    });

    test('Library (Draw until 7, skip Actions)', () => {
        const engine = new TestEngine();
        engine.setHand(['library']);
        engine.setDeck(['copper', 'copper', 'copper', 'copper', 'village', 'copper', 'copper', 'copper', 'copper']);

        engine.playCard('library');

        expect(engine.state.pendingDecision).toBeDefined();

        engine.respondToDecision({ choice: 'YES' });

        const p = engine.getPlayer();
        expect(p.hand).toHaveLength(7);
        expect(p.discardPile.find(c => c.id === 'village')).toBeDefined();
    });

    test('Mine (Trash Treasure, Gain Upgrade)', () => {
        const engine = new TestEngine();
        engine.setHand(['mine', 'copper']);

        engine.playCard('mine');

        expect(engine.state.pendingDecision).toBeDefined();
        const p = engine.getPlayer();
        const copper = p.hand.find((c: any) => c.id === 'copper')!;

        engine.respondToDecision({
            type: 'CARDS',
            cardIds: [copper.instanceId]
        });

        expect(engine.state.pendingDecision).toBeDefined();
        engine.respondWithSupply('silver');

        expect(p.hand).toHaveLength(1);
        expect(p.hand[0].id).toBe('silver');
        expect(engine.state.trash.find(c => c.id === 'copper')).toBeDefined();
    });

});
