
import { CardRegistry } from './shared/cards/index.js';

const candidates = CardRegistry.getKingdomCandidates();
const heirloomsInCandidates = candidates.filter(id => {
    const def = CardRegistry.get(id);
    return def?.types.includes('HEIRLOOM');
});

console.log('Total Candidates:', candidates.length);
console.log('Heirlooms in candidates (should be empty):', heirloomsInCandidates);

const goat = CardRegistry.get('goat');
console.log('Goat isNonSupply:', goat?.isNonSupply);
console.log('Goat types:', goat?.types);

process.exit(0);
