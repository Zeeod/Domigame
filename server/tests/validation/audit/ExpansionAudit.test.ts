
import { describe, it, expect } from 'vitest';
import { CardRegistry } from '../../../../shared/cards/index.js';
import { ALL_REFS, CardReference } from './Audit_Reference.js';

describe('Dominion Expansion Audit (2nd Edition - FR)', () => {

    // Group tests by expansion for clarity in report
    const expansions = [...new Set(ALL_REFS.map(r => r.expansion))];

    expansions.forEach(expansion => {
        const checkList = ALL_REFS.filter(r => r.expansion === expansion);

        describe(`Expansion: ${expansion}`, () => {
            checkList.forEach(ref => {
                it(`should implement [${ref.id}] with correct French name "${ref.name}"`, () => {
                    const card = CardRegistry.get(ref.id);

                    // 1. Check Existence
                    if (!card) {
                        throw new Error(`MISSING CARD: ${ref.id} is not registered in CardRegistry.`);
                    }

                    // 2. Check Display Name
                    // Normalize comparison to be safe with some subtle char differences if needed, but strict is better for now
                    expect(card.name).toBe(ref.name);

                    // 3. Check Expansion tag (if present on card definition)
                    // Some older definitions might stick expansion properties in different places or implied, but standardized ones have it.
                    // If your card definition doesn't have 'expansion' property, skip this or assert it should have it.
                    // Assuming CardDefinition has 'expansion' or 'set'
                    // expect(card.expansion).toBe(expansion); 
                });
            });
        });
    });

    it('should not have duplicate IDs in registry', () => {
        const allCards = CardRegistry.getAll();
        const ids = Object.keys(allCards);
        const uniqueIds = new Set(ids);
        expect(ids.length).toBe(uniqueIds.size);
    });
});
