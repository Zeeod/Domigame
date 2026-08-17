const fs = require('fs');
const data = JSON.parse(fs.readFileSync('test_results.json', 'utf8'));
const failed = [];
for (const file of data.testResults) {
    if (file.status === 'failed') {
        for (const assertion of file.assertionResults) {
            if (assertion.status === 'failed') {
                failed.push({
                    file: file.name,
                    title: assertion.title,
                    error: assertion.failureMessages.join('\n')
                });
            }
        }
    }
}
fs.writeFileSync('failed_tests_summary.json', JSON.stringify(failed, null, 2));
console.log(`Found ${failed.length} failed tests.`);
