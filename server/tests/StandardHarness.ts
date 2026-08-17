
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '../..');

interface TestStage {
    name: string;
    command: string;
    args: string[];
    description: string;
}

const stages: TestStage[] = [
    {
        name: 'Validation',
        command: 'npx',
        args: ['tsx', 'server/tests/validate_all_cards.ts'],
        description: 'Instantiate and validate all cards in registry'
    },
    {
        name: 'Stability',
        command: 'npx',
        args: ['vitest', 'run', 'server/tests/Stability.test.ts'],
        description: 'Run randomized full games to check for crashes'
    },
    {
        name: 'Mechanics',
        command: 'npx',
        args: ['vitest', 'run', 'server/tests/MechanicsAudit.test.ts'],
        description: 'Verify specific mechanic implementations'
    },
    {
        name: 'Regression',
        command: 'npx',
        args: ['vitest', 'run', 'server/tests/StressTest.test.ts'],
        description: 'Run stress tests and known regression scenarios'
    }
];

async function runStage(stage: TestStage): Promise<boolean> {
    console.log(`\n---------------------------------------------------`);
    console.log(`[HARNESS] Starting Stage: ${stage.name}`);
    console.log(`[HARNESS] Description: ${stage.description}`);
    console.log(`[HARNESS] Command: ${stage.command} ${stage.args.join(' ')}`);
    console.log(`---------------------------------------------------\n`);

    return new Promise((resolve) => {
        const start = Date.now();
        // Force color output for vitest
        const env = { ...process.env, FORCE_COLOR: '1' };

        const proc = spawn(stage.command, stage.args, {
            cwd: projectRoot,
            stdio: 'inherit',
            env,
            shell: true
        });

        proc.on('close', (code) => {
            const duration = ((Date.now() - start) / 1000).toFixed(2);
            if (code === 0) {
                console.log(`\n✅ [HARNESS] Stage '${stage.name}' PASSED in ${duration}s`);
                resolve(true);
            } else {
                console.error(`\n❌ [HARNESS] Stage '${stage.name}' FAILED (Exit Code: ${code}) in ${duration}s`);
                resolve(false);
            }
        });

        proc.on('error', (err) => {
            console.error(`\n❌ [HARNESS] Stage '${stage.name}' ERRORED:`, err);
            resolve(false);
        });
    });
}

async function main() {
    console.log(`
===================================================
   DOMINION ENGINE - STANDARD TEST HARNESS
===================================================
`);

    const results: Record<string, boolean> = {};
    let allPassed = true;

    for (const stage of stages) {
        const passed = await runStage(stage);
        results[stage.name] = passed;
        if (!passed) {
            allPassed = false;
            // Option: Break on failure? Or run all?
            // Let's run all to get full report.
        }
    }

    console.log(`\n===================================================`);
    console.log(`   HARNESS RESULTS`);
    console.log(`===================================================`);

    stages.forEach(stage => {
        const status = results[stage.name] ? '✅ PASS' : '❌ FAIL';
        console.log(`${stage.name.padEnd(15)}: ${status}`);
    });

    if (allPassed) {
        console.log(`\n✅ SUCCÈS GLOBAL : Le moteur est stable et valide.`);
        process.exit(0);
    } else {
        console.error(`\n❌ ÉCHEC GLOBAL : Certaines étapes ont échoué.`);
        process.exit(1);
    }
}

main().catch(console.error);
