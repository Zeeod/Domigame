import fs from 'fs';
const data = fs.readFileSync('full_tsc_output.txt', 'utf16le');
const lines = data.split('\n');
lines.forEach(line => {
    if (line.includes('error TS')) {
        console.log(line.trim());
    }
});
