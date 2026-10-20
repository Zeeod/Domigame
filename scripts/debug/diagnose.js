import fs from 'fs';

function readUtf16(path) {
    try {
        if (!fs.existsSync(path)) return null;
        return fs.readFileSync(path, 'utf16le');
    } catch (e) {
        return null;
    }
}

console.log('--- TSC ERRORS ---');
const tsc = readUtf16('full_tsc_output.txt');
if (tsc) {
    const errorLines = tsc.split('\n').filter(line => line.includes('error TS'));
    console.log(`Found ${errorLines.length} TSC errors.`);
    errorLines.slice(0, 20).forEach(line => console.log(line.trim()));
} else {
    console.log('TSC log not found or empty.');
}

console.log('\n--- VITEST FAILURES ---');
const test = readUtf16('full_test_output.txt');
if (test) {
    const lines = test.split('\n');
    const fails = lines.filter(line => line.includes('FAIL') || line.includes('AssertionError') || line.includes('error:'));
    console.log(`Found ${fails.length} potential test failure indicators.`);
    // Find the actual failure details
    let capture = false;
    let count = 0;
    for (const line of lines) {
        if (line.includes('FAIL')) capture = true;
        if (capture) {
            console.log(line.trim());
            count++;
        }
        if (count > 50) break; // Limit output
    }
} else {
    console.log('Test log not found or empty.');
}
