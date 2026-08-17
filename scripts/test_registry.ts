
import { CardRegistry } from './shared/cards/index.js';

console.log('Loading CardRegistry...');
try {
    const cards = CardRegistry.getAll();
    console.log(`Successfully loaded ${Object.keys(cards).length} cards.`);
    console.log('Sample card:', CardRegistry.get('village')?.name);
    console.log('Dark Ages card:', CardRegistry.get('cultist')?.id);
    console.log('Ruins pile:', CardRegistry.get('ruins')?.id);
    console.log('Knights pile:', CardRegistry.get('knights')?.id);
} catch (err) {
    console.error('CRASH DURING REGISTRY LOADING:', err);
}
