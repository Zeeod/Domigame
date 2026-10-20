
import { CardRegistry } from '../../shared/cards/index.js';
import * as fs from 'fs';
import * as path from 'path';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load validation failures if available
let failedCards = new Set<string>();
const validationOutput = path.join(__dirname, '../../card_validation_output.txt');
if (fs.existsSync(validationOutput)) {
    const content = fs.readFileSync(validationOutput, 'utf-8');
    const lines = content.split('\n');
    lines.forEach(line => {
        if (line.includes('FAILED') || line.includes('❌')) {
            // Extract card name/ID if possible, or just rely on the "Failed Cards:" section
            // Simple hack: look for parenthesis (id)
            const match = line.match(/\(([^)]+)\)/);
            if (match) failedCards.add(match[1]);
        }
        if (line.trim().startsWith('•')) {
            const match = line.match(/\(([^)]+)\)/);
            if (match) failedCards.add(match[1]);
        }
    });
}

const allCards = CardRegistry.getAll();
const byExpansion: Record<string, string[]> = {};

Object.values(allCards).forEach(card => {
    const exp = card.expansion || 'unknown';
    if (!byExpansion[exp]) byExpansion[exp] = [];
    byExpansion[exp].push(card.id);
});

console.log('--- INVENTORY REPORT ---');
Object.keys(byExpansion).sort().forEach(exp => {
    console.log(`\n### ${exp.toUpperCase()} (${byExpansion[exp].length} cards)`);
    byExpansion[exp].sort().forEach(id => {
        const failed = failedCards.has(id) ? '❌ FAILED' : '✅ OK';
        console.log(`- ${id}: ${failed}`);
    });
});
