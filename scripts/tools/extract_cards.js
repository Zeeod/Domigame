
import * as fs from 'fs';
import * as path from 'path';

const cardsDir = 'd:/Jeux/Developpement/dominion/shared/cards';
const results: any[] = [];

function walk(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (file.endsWith('.ts') && file !== 'index.ts' && !file.includes('Shelters') && !file.includes('Ruins') && !file.includes('Knights')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const nameMatch = content.match(/name:\s*['"`](.*)['"Selection]/);
            const expansionMatch = content.match(/expansion:\s*['"`](.*)['"Selection]/);
            const setMatch = content.match(/set:\s*['"`](.*)['"Selection]/);

            results.push({
                file: path.relative(cardsDir, fullPath),
                id: path.basename(file, '.ts'),
                name: nameMatch ? nameMatch[1] : 'N/A',
                expansion: expansionMatch ? expansionMatch[1] : (setMatch ? setMatch[1] : 'N/A')
            });
        }
    }
}

walk(cardsDir);
console.log(JSON.stringify(results, null, 2));
