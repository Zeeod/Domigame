import { describe, it, expect } from 'vitest';
import { SupplyGenerator } from './shared/engine/SupplyGenerator.js';

describe('Bug Reproduction: Landscape Selection', () => {
    it('should NOT generate landscapes if instructions are empty', () => {
        const landscapes = SupplyGenerator.getLandscapes({
            enabledExpansions: ['base', 'empires'], // Empires has landmarks/events
            landscapeInstructions: []
        });

        // CURRENT BEHAVIOR: Generates 2 random landscapes
        // DESIRED BEHAVIOR: Generates 0
        console.log('Generated Landscapes:', landscapes);

        // This expectation will FAIL currently
        expect(landscapes.length).toBe(0);
    });

    it('should generate landscapes if explicitly requested', () => {
        const landscapes = SupplyGenerator.getLandscapes({
            enabledExpansions: ['empires'],
            landscapeInstructions: ['random:event']
        });
        expect(landscapes.length).toBe(1);
    });
});
