
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = path.resolve('vitest_output.log');
const stream = fs.createWriteStream(logFile, { encoding: 'utf8' });

console.log('Running vitest...');
// Use npx (no .cmd on all platforms, but win usually needs .cmd)
// Actually just spawning 'npx.cmd' works on windows.
const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const child = spawn(cmd, ['vitest', 'run', 'server/tests/DarkAgesSetup.test.ts', '--reporter=verbose'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    cwd: process.cwd()
});

child.stdout.pipe(stream);
child.stderr.pipe(stream);
// Also pipe to stdout (might be truncated by cortex, but we rely on file)
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

child.on('close', (code) => {
    console.log(`Vitest exited with code ${code}`);
    stream.end();
});
