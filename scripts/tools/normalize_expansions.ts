/**
 * Normalise le champ `expansion` de toutes les cartes (ids canoniques de
 * shared/cards/expansions.ts) et supprime le doublon `set`.
 * Usage : npx tsx scripts/tools/normalize_expansions.ts
 */
import fs from 'fs';
import path from 'path';
import { normalizeExpansion } from '../../shared/cards/expansions.js';

function walk(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.ts') ? [path.join(dir, e.name)] : []);
}

let changed = 0;
const unknown = new Set<string>();
for (const file of walk('shared/cards')) {
    if (file.endsWith('expansions.ts')) continue;
    const src = fs.readFileSync(file, 'utf8');
    let out = src.replace(/expansion:\s*'([^']*)'/g, (m, v) => {
        const id = normalizeExpansion(v);
        if (!id) { unknown.add(v); return m; }
        return `expansion: '${id}'`;
    });
    // `set` : supprimé si l'objet a déjà `expansion`, sinon converti en `expansion`.
    const setLine = /^([ \t]*)set:\s*'([^']*)',?[ \t]*(\/\/[^\n]*)?\r?\n/gm;
    out = out.replace(setLine, (m, indent, v, _c, offset: number, whole: string) => {
        const before = whole.lastIndexOf('id:', offset);
        let after = whole.indexOf('id:', offset);
        if (after === -1) after = whole.length;
        const objectText = whole.slice(before === -1 ? 0 : before, after);
        if (/expansion:/.test(objectText)) return '';
        const id = normalizeExpansion(v);
        if (!id) { unknown.add(v); return m; }
        return `${indent}expansion: '${id}',\n`;
    });
    if (out !== src) { fs.writeFileSync(file, out); changed++; }
}
console.log(`${changed} fichiers modifiés`);
if (unknown.size) console.log('Valeurs inconnues :', [...unknown]);
