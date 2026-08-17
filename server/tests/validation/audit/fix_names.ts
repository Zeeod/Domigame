
import { CardRegistry } from '../../../../shared/cards/index.js';
import { ALL_REFS } from './Audit_Reference.js';
import * as fs from 'fs';
import * as path from 'path';

// Map expansion names to folder names if specific overrides needed
const EXPANSION_MAP: Record<string, string> = {
    'base': 'base',
    'intrigue': 'intrigue',
    'seaside': 'seaside',
    'prosperity': 'prosperity'
};

const ROOT_DIR = path.resolve('shared/cards');

console.log('Starting Auto-Fix...');

ALL_REFS.forEach(ref => {
    const card = CardRegistry.get(ref.id);

    // 1. Missing Card Logic
    if (!card) {
        console.log(`[MISSING] ${ref.id} (${ref.expansion}) - File or Registry entry missing.`);
        // Try to see if file exists but not registered
        const filePath = path.join(ROOT_DIR, ref.expansion, `${ref.id}.ts`);
        if (fs.existsSync(filePath)) {
            console.log(`   -> File exists at ${filePath}, but likely not exported/registered in index.ts`);
        } else {
            console.log(`   -> File does NOT exist at ${filePath}`);
        }
        return;
    }

    // 2. Name Mismatch Logic
    if (card.name !== ref.name) {
        console.log(`[MISMATCH] ${ref.id}: "${card.name}" should be "${ref.name}"`);

        // Attempt to fix file
        const expansionFolder = EXPANSION_MAP[ref.expansion] || ref.expansion;
        const filePath = path.join(ROOT_DIR, expansionFolder, `${ref.id}.ts`);

        if (fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf8');
            // Look for name: 'OldName' or name: "OldName"
            // We use a regex that matches the current name specifically to avoid false positives
            const currentNameEscaped = card.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Regex to match: name: 'CurrentName', allowing for whitespace
            const regex = new RegExp(`name:\\s*['"]${currentNameEscaped}['"]`);

            if (regex.test(content)) {
                console.log(`   -> Fixing file: ${filePath}`);
                const newContent = content.replace(regex, `name: '${ref.name.replace(/'/g, "\\'")}'`);
                fs.writeFileSync(filePath, newContent, 'utf8');
            } else {
                console.log(`   -> CRITICAL: Could not find pattern in file ${filePath}`);
                console.log(`      Regex: ${regex.source}`);
                console.log(`      Target Name: ${JSON.stringify(card.name)}`);
                // Print a snippet of the file to see what's there
                const nameIndex = content.indexOf('name:');
                if (nameIndex !== -1) {
                    console.log(`      Found 'name:' at index ${nameIndex}. Context: ${JSON.stringify(content.substring(nameIndex, nameIndex + 30))}`);
                }
            }
        } else {
            console.log(`   -> File not found at calculated path: ${filePath}`);
            // Fallback: search recursively? No, keep it simple.
        }
    }
});

console.log('Done.');
