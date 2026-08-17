
import { SupplyGenerator } from '../../shared/engine/SupplyGenerator';

console.log('Testing SupplyGenerator...');

try {
    const runs = 10;
    let failures = 0;

    for (let i = 0; i < runs; i++) {
        const seed = `test_seed_${i}_${Date.now()}`;
        const supply = SupplyGenerator.generate({
            count: 10,
            seed,
            enabledExpansions: [] // Test with 'base' implied
        });

        console.log(`Run ${i + 1}: Count=${supply.length}`);

        if (supply.length !== 10) {
            console.error(`ERROR: Run ${i + 1} generated ${supply.length} cards! Seed: ${seed}`);
            console.log('Cards:', supply);
            failures++;
        }
    }

    if (failures === 0) {
        console.log('SUCCESS: All runs generated 10 cards.');
    } else {
        console.error(`FAILURE: ${failures}/${runs} runs failed.`);
        process.exit(1);
    }
} catch (err) {
    console.error('Crash:', err);
    process.exit(1);
}
