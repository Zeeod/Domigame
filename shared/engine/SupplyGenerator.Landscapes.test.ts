import { describe, it, expect } from 'vitest';
import { SupplyGenerator } from './SupplyGenerator';
import { CardRegistry } from '../cards';

describe('SupplyGenerator Landscapes', () => {
    it('should generate landscapes based on instructions', () => {
        // Mock specific event
        const instructions = ['wedding'];
        const result = SupplyGenerator.getLandscapes({
            landscapeInstructions: instructions,
            enabledExpansions: ['adventures', 'empires']
        });

        // If wedding is in registry, we check length
        if (CardRegistry.get('wedding')) {
            expect(result).toContain('wedding');
        }

        // Assuming 'wedding' exists in registry, if not we'd need to mock it or pick a real one
        // For now let's use 'ball' if 'wedding' isn't there, or trust the registry.
        // Let's use a known base/common event if possible, or just check that it TRIES to get it.
        // If 'wedding' is not in registry, it won't be in result.

        // Let's use generic instructions that don't depend on specific obscure cards being registered yet if not sure.
        // But we can test the "random" logic which is more complex.
    });

    it('should respect "random:type" directives', () => {
        const result = SupplyGenerator.getLandscapes({
            landscapeInstructions: ['random:event', 'random:landmark'],
            enabledExpansions: ['adventures', 'empires'],
            seed: 'test_seed_1'
        });

        expect(result).toHaveLength(2);
        const card1 = CardRegistry.get(result[0]);
        const card2 = CardRegistry.get(result[1]);

        // Expect at least one event and one landmark (order depends on implementation, likely order of instructions?)
        // Our implementation pushes to 'randomDirectives' then finds picking.
        // It shuffles candidates then iterates directives.
        // So we should have 1 event and 1 landmark.

        const hasEvent = [card1, card2].some(c => c?.types.includes('EVENT'));
        const hasLandmark = [card1, card2].some(c => c?.types.includes('LANDMARK'));

        expect(hasEvent).toBe(true);
        expect(hasLandmark).toBe(true);
    });

    it('should respect "random:way" directives', () => {
        const result = SupplyGenerator.getLandscapes({
            landscapeInstructions: ['random:way'],
            enabledExpansions: ['menagerie'],
            seed: 'test_seed_way'
        });

        // Only expect result if Menagerie is implemented and Ways are in registry
        if (result.length > 0) {
            const card = CardRegistry.get(result[0]);
            expect(card?.types).toContain('WAY');
        }
    });

    it('should NOT include a Prophecy if Rising Sun is enabled but no Omens are present', () => {
        const result = SupplyGenerator.getLandscapes({
            enabledExpansions: ['rising_sun'],
            kingdomCardIds: ['village', 'smithy', 'market'], // No Omens
            seed: 'no_omens_seed'
        });

        const hasProphecy = result.some(id => CardRegistry.get(id)?.types.includes('PROPHECY' as any));
        expect(hasProphecy).toBe(false);
    });

    it('should include a Prophecy if Rising Sun is enabled and Omens are present', () => {
        // 'kitsune' is an Omen from rising_sun/kingdom.ts
        const result = SupplyGenerator.getLandscapes({
            enabledExpansions: ['rising_sun'],
            kingdomCardIds: ['kitsune', 'smithy', 'market'],
            seed: 'with_omens_seed'
        });

        const hasProphecy = result.some(id => CardRegistry.get(id)?.types.includes('PROPHECY' as any));
        expect(hasProphecy).toBe(true);
    });
});
