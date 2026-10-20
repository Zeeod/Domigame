import fs from 'fs';
const file = process.argv[2];
if (!file) {
    console.error('No file specified');
    process.exit(1);
}
try {
    const data = fs.readFileSync(file, 'utf16le');
    console.log(data);
} catch (e) {
    console.error(e);
    process.exit(1);
}
