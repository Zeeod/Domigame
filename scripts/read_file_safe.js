const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];
if (!filePath) {
    console.error('Usage: node read_file_utf8.js <file>');
    process.exit(1);
}

try {
    // Try reading as utf8 first
    const content = fs.readFileSync(filePath, 'utf8');
    // Sanitize non-printable characters if necessary, but just printing should be fine for simple logs
    console.log(content);
} catch (err) {
    console.error('Error reading file:', err);
}
