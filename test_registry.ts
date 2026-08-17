
import { CardRegistry } from './shared/cards/index.js';

console.log('Attempting to load CardRegistry...');
try {
    const allCards = CardRegistry.getAll();
    console.log(`Successfully loaded ${Object.keys(allCards).length} cards.`);
} catch (e) {
    console.error('FAILED to load CardRegistry:', e);
    process.exit(1);
}
