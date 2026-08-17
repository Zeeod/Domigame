
import { CardRegistry } from '../../../../shared/cards/index.js';
import { ALL_REFS } from './Audit_Reference.js';
import * as fs from 'fs';
import * as path from 'path';

const logFile = path.resolve('audit_errors.txt');
fs.writeFileSync(logFile, 'Starting Manual Audit...\n');

function log(msg: string) {
    fs.appendFileSync(logFile, msg + '\n');
    console.log(msg);
}

console.log('Starting Manual Audit...');

let missingCount = 0;
let nameMismatchCount = 0;
let successCount = 0;

ALL_REFS.forEach(ref => {
    const card = CardRegistry.get(ref.id);
    if (!card) {
        log(`[MISSING] ${ref.id} (${ref.expansion})`);
        missingCount++;
    } else {
        if (card.name !== ref.name) {
            log(`[NAME_MISMATCH] ${ref.id}: Expected "${ref.name}", got "${card.name}"`);
            nameMismatchCount++;
        } else {
            successCount++;
        }
    }
});

log('--- Summary ---');
log(`Total Checked: ${ALL_REFS.length}`);
log(`Success: ${successCount}`);
log(`Missing: ${missingCount}`);
log(`Name Mismatch: ${nameMismatchCount}`);

if (missingCount > 0 || nameMismatchCount > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
