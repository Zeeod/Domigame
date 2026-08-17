
import { CardRegistry } from '../../../../shared/cards/index.js';
import { ALL_REFS } from './Audit_Reference.js';
import * as fs from 'fs';
import * as path from 'path';

const logFile = path.resolve('missing_cards.txt');
fs.writeFileSync(logFile, '');

ALL_REFS.forEach(ref => {
    if (!CardRegistry.get(ref.id)) {
        fs.appendFileSync(logFile, `${ref.id}\n`);
    }
});
