import { exec } from 'child_process';

const args = process.argv.slice(2);
const PORTS = args.length > 0 ? args.map(arg => parseInt(arg, 10)).filter(p => !isNaN(p)) : [3000, 3005];

if (PORTS.length === 0) {
    console.error('[CLEANUP] No valid ports specified.');
    process.exit(1);
}

function cleanPorts() {
    console.log(`[CLEANUP] Checking ports: ${PORTS.join(', ')}...`);

    // Windows specific command to find PIDs on specific ports
    const command = `netstat -ano | findstr "${PORTS.map(p => ':' + p).join(' ')}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            // If findstr returns exit code 1, it means no matches found, which is good
            if (error.code === 1) {
                console.log('[CLEANUP] No active processes found on target ports.');
                return;
            }
            // Other errors
            console.error(`[CLEANUP] Error checking ports: ${error.message}`);
            return;
        }

        const lines = stdout.split('\n');
        const pidsToKill = new Set();

        lines.forEach(line => {
            // Parse netstat output: TCP    0.0.0.0:3005           0.0.0.0:0              LISTENING       12345
            const parts = line.trim().split(/\s+/);
            if (parts.length > 4) {
                // The PID is usually the last element
                const pid = parts[parts.length - 1];
                const state = parts[3]; // LISTENING, ESTABLISHED, etc.

                // We mainly care about LISTENING, but killing anything on that port is checking "usage"
                // Check if the local address (parts[1]) ends with one of our ports
                const localAddress = parts[1];
                const portMatch = PORTS.some(port => localAddress.endsWith(`:${port}`));

                if (portMatch && pid && parseInt(pid) > 0) {
                    pidsToKill.add(pid);
                }
            }
        });

        if (pidsToKill.size === 0) {
            console.log('[CLEANUP] No processes found to kill.');
            return;
        }

        console.log(`[CLEANUP] Found PIDs to kill: ${Array.from(pidsToKill).join(', ')}`);

        // Kill each PID
        pidsToKill.forEach(pid => {
            exec(`taskkill /F /PID ${pid}`, (killError, killStdout) => {
                if (killError) {
                    console.error(`[CLEANUP] Failed to kill PID ${pid}: ${killError.message}`);
                } else {
                    console.log(`[CLEANUP] Successfully killed PID ${pid}`);
                }
            });
        });
    });
}

cleanPorts();
