import { describe, it, expect } from 'vitest';
import { CardRegistry } from '../../shared/cards/index.js';
import { UNFINISHED_CARDS, SHELL_CARDS } from '../../shared/cards/unfinished.js';
import { SupplyGenerator } from '../../shared/engine/SupplyGenerator.js';

const hasEffects = (id: string): boolean => {
    const c = CardRegistry.get(id) as any;
    return Object.entries(c ?? {}).some(([k, v]) =>
        /effects$/i.test(k) && Array.isArray(v) && v.length > 0);
};

describe('Cartes non finies (shared/cards/unfinished.ts)', () => {
    it('chaque id listé existe dans le registre', () => {
        const unknown = [...UNFINISHED_CARDS].filter(id => !CardRegistry.get(id));
        expect(unknown).toEqual([]);
    });

    it('aucune carte listée n\'a déjà des effets (sinon la retirer de la liste)', () => {
        const done = [...SHELL_CARDS].filter(hasEffects);
        expect(done).toEqual([]);
    });

    it('ne sont jamais proposées dans le royaume', () => {
        const kingdom = CardRegistry.getKingdomCandidates();
        expect(kingdom.filter(id => UNFINISHED_CARDS.has(id))).toEqual([]);
    });

    it('ne sont jamais proposées comme paysage', () => {
        const landscapes = CardRegistry.getLandscapeCandidates().map(c => c.id);
        expect(landscapes.filter(id => UNFINISHED_CARDS.has(id))).toEqual([]);

        for (let i = 0; i < 20; i++) {
            const drawn = SupplyGenerator.getLandscapes({ seed: `t${i}`, landscapeInstructions: ['event', 'landmark', 'project', 'way', 'trait', 'ally'] });
            expect(drawn.filter(id => UNFINISHED_CARDS.has(id))).toEqual([]);
        }
    });
});
