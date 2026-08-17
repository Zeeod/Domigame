const fs = require('fs');
const path = require('path');

const cardsDir = path.join(__dirname, '../shared/cards');
const outputFile = path.join(__dirname, 'implemented_cards.json');

function scanDir(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            if (file !== 'tests' && file !== 'drafts') {
                scanDir(filePath, fileList);
            }
        } else if (file.endsWith('.ts') && file !== 'index.ts') {
            fileList.push(filePath);
        }
    });
    return fileList;
}

const allCards = [];
const files = scanDir(cardsDir);

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');

    // Simple regex to extract basic info. 
    // This assumes standard formatting: export const cardName: CardDefinition = { ... }

    const idMatch = content.match(/id:\s*['"]([^'"]+)['"]/);
    const nameMatch = content.match(/name:\s*['"]([^'"]+)['"]/);
    // Expansion might be derived from folder or explicit field
    const expansionMatch = content.match(/expansion:\s*['"]([^'"]+)['"]/);
    const typesMatch = content.match(/types:\s*\[(.*?)\]/s);

    if (idMatch) {
        const relativePath = path.relative(cardsDir, file);
        const folder = path.dirname(relativePath).split(path.sep)[0];

        let types = [];
        if (typesMatch) {
            types = typesMatch[1]
                .replace(/['"\s]/g, '')
                .split(',')
                .filter(t => t.length > 0);
        }

        allCards.push({
            id: idMatch[1],
            name: nameMatch ? nameMatch[1] : 'Unknown',
            expansion: expansionMatch ? expansionMatch[1] : folder,
            types: types,
            file: relativePath
        });
    }
});

console.log(`Found ${allCards.length} cards.`);
fs.writeFileSync(outputFile, JSON.stringify(allCards, null, 2));
