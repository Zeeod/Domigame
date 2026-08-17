import { CardRegistry } from '../shared/cards/index.js';

console.log('--- Kingdom Candidates Verification ---');
try {
    const candidates = CardRegistry.getKingdomCandidates();
    console.log(`Total candidates found: ${candidates.length}`);

    // Check for duplicates
    const uniqueIds = new Set(candidates);
    if (uniqueIds.size !== candidates.length) {
        console.error('FAIL: Found duplicates in kingdom candidates!');
    } else {
        console.log('SUCCESS: No duplicates found.');
    }

    // Check Sample
    console.log('Sample candidates:', candidates.slice(0, 5));

    // Check count - should be much more than 10
    if (candidates.length < 50) {
        console.warn('WARNING: Low number of candidates. Check filtering.');
    } else {
        console.log(`SUCCESS: Candidate pool size looks good (${candidates.length}).`);
    }

    // Check for specific excluded cards
    const excluded = ['potion', 'curse', 'copper', 'estate', 'duchy', 'province'];
    const foundExcluded = candidates.filter(id => excluded.includes(id));
    if (foundExcluded.length > 0) {
        console.error('FAIL: Found excluded cards in candidates:', foundExcluded);
    } else {
        console.log('SUCCESS: No basic supply cards in candidates.');
    }

} catch (err) {
    console.error('CRASH:', err);
}
