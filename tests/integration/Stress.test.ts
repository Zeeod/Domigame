/**
 * Complete games between bots on random kingdoms and landscapes from every expansion (real server setup).
 * Each game must end, keep the card count, and never leave a decision unanswerable.
 * Bigger runs: npx tsx scripts/audit/stress.ts 200
 */
import { describe, it, expect } from 'vitest';
import { runStress } from '../../scripts/audit/stress.js';

describe('Stress : parties complètes de bots', () => {
    it('6 parties aléatoires (2 à 4 joueurs) vont au bout sans erreur', () => {
        const results = runStress(6, 2026);
        const failures = results.filter(r => r.error || !r.finished).map(r => `#${r.game} [${r.kingdom.join(',')}] ${r.error}`);
        expect(failures).toEqual([]);
    }, 300000);
});
