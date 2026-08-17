
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = path.resolve('vitest_output.log');
const stream = fs.createWriteStream(logFile, { encoding: 'utf8' });

console.log('Running vitest...');
const child = spawn('npx.cmd', ['vitest', 'run', 'server/tests/DarkAgesSetup.test.ts', '--reporter=verbose'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    cwd: process.cwd()
});

child.stdout.pipe(stream);
child.stderr.pipe(stream);
child.stdout.pipe(process.stdout); // Also print to console just in case
child.stderr.pipe(process.stderr);

child.on('close', (code) => {
    console.log(`Vitest exited with code ${code}`);
    stream.end();
});
