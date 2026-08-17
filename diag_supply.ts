import { SupplyGenerator } from './shared/engine/SupplyGenerator.js';
import { CardRegistry } from './shared/cards/index.js';

console.log('--- Diagnostic Start ---');
const candidates = CardRegistry.getKingdomCandidates();
console.log('Kingdom Candidates Count:', candidates.length);

const kingdom = SupplyGenerator.generate();
console.log('Generated Kingdom Count:', kingdom.length);
console.log('Generated Kingdom:', kingdom);
console.log('--- Diagnostic End ---');
