
import { describe, test, expect } from 'vitest';
import { TestEngine } from './TestUtils';

describe('Hostelry Validation', () => {

    test('should prompt to discard treasures from play on gain', () => {
        const engine = new TestEngine();

        // Ensure Hostelry is in supply (mock)
        if (!engine.state.supply['hostelry']) {
            engine.state.supply['hostelry'] = {
                cardId: 'hostelry',
                count: 10,
                cards: [],
                tokens: {}
            };
        }

        // Setup Player with Treasures in Play
        engine.setPlayArea(['copper', 'copper', 'silver']);

        // Gain Hostelry
        // This triggers onGain effects
        engine.gainCard('hostelry');

        // Expect Decision
        expect(engine.state.pendingDecision).toBeDefined();
        if (engine.state.pendingDecision) {
            expect(engine.state.pendingDecision.type).toBe('CHOOSE_CARDS');
            expect(engine.state.pendingDecision.constraints?.sourceZone).toBe('playArea');
            // Check context for destination (modular effect)
            expect(engine.state.pendingDecision.context?.destination).toBe('discardPile');
        }
    });

    test('should discard selected treasures', () => {
        const engine = new TestEngine();
        if (!engine.state.supply['hostelry']) {
            engine.state.supply['hostelry'] = {
                cardId: 'hostelry',
                count: 10,
                cards: [],
                tokens: {}
            };
        }

        // Setup Player with Treasures in Play
        engine.setPlayArea(['copper', 'silver']);
        const player = engine.getPlayer();

        // Get instance IDs
        const copper = player.playArea.find(c => c.id === 'copper');
        const silver = player.playArea.find(c => c.id === 'silver');

        if (!copper || !silver) throw new Error('Setup failed: Treasures not found in play area');

        // Gain Hostelry
        engine.gainCard('hostelry');

        expect(engine.state.pendingDecision).toBeDefined();

        // Respond to decision: Discard Copper
        engine.respondToDecision({
            type: 'CARDS',
            cardInstanceIds: [copper.instanceId]
        });

        // Verify: Copper in discard, Silver in play
        expect(player.discardPile.some(c => c.instanceId === copper.instanceId)).toBe(true);
        expect(player.playArea.some(c => c.instanceId === silver.instanceId)).toBe(true);

        // Hostelry should also be in discard (gained)
        expect(player.discardPile.some(c => c.id === 'hostelry')).toBe(true);
    });

    test('should match filter (only treasures)', () => {
        const engine = new TestEngine();
        if (!engine.state.supply['hostelry']) {
            engine.state.supply['hostelry'] = {
                cardId: 'hostelry',
                count: 10,
                cards: [],
                tokens: {}
            };
        }

        // Setup Player with Treasures AND Actions in Play
        engine.setPlayArea(['copper', 'village']);

        // Gain Hostelry
        engine.gainCard('hostelry');

        expect(engine.state.pendingDecision).toBeDefined();
        // Check filter
        expect(engine.state.pendingDecision?.constraints?.filter?.cardTypes).toContain('TREASURE');
    });
});
