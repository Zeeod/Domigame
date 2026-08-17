
import { CardRegistry } from './shared/cards/index.js';

const candidates = CardRegistry.getKingdomCandidates();
console.log('Candidates count:', candidates.length);

const knights = candidates.filter(id => id.startsWith('dame_') || id.startsWith('sir_') || id === 'knights');
console.log('Knights candidates:', knights);

const card = CardRegistry.get('knights');
console.log('Knights pile definition:', JSON.stringify(card, null, 2));
