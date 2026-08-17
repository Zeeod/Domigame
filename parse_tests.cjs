const fs = require('fs');
let rawData = fs.readFileSync('test_results.json');
let dataStr = '';
// Check for UTF-16 LE BOM
if (rawData.length >= 2 && rawData[0] === 0xFF && rawData[1] === 0xFE) {
    dataStr = rawData.toString('utf16le');
} else {
    dataStr = rawData.toString('utf8');
}
// Strip BOM if present
if (dataStr.charCodeAt(0) === 0xFEFF) {
    dataStr = dataStr.slice(1);
}

const data = JSON.parse(dataStr);
const failed = [];
for (const file of data.testResults) {
    if (file.status === 'failed') {
        for (const assertion of file.assertionResults) {
            if (assertion.status === 'failed') {
                failed.push({
                    file: file.name,
                    title: assertion.title,
                    error: assertion.failureMessages.join('\n').substring(0, 200) // keep error msg short
                });
            }
        }
    }
}
fs.writeFileSync('failed_tests_summary.json', JSON.stringify(failed, null, 2), 'utf8');
console.log(`Found ${failed.length} failed tests.`);
