import { execSync } from 'child_process';
import * as fs from 'fs';

try {
    execSync('npm run check-types > tsc_output.txt 2>&1', { shell: true });
    console.log('Build successful');
} catch (error) {
    const output = fs.readFileSync('tsc_output.txt', 'utf8');
    console.log(output);
}
