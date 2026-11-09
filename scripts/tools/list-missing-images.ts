/**
 * Liste les cartes qui n'ont pas encore d'illustration.
 * Usage : npx tsx scripts/tools/list-missing-images.ts
 * Écrit docs/images/IMAGES_MANQUANTES.md et docs/images/images-manquantes.csv.
 *
 * Une image compte comme présente si <id>.jpg / .png existe dans
 * client/public/card-images (livrées avec le jeu) ou data/card-images (dossier du NAS).
 */
import fs from 'fs';
import path from 'path';
import { CardRegistry } from '../../shared/cards/index';
import { EXPANSION_IDS, EXPANSION_LABELS, getCardExpansion } from '../../shared/cards/expansions';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '../..');
const IMAGE_DIRS = ['client/public/card-images', 'data/card-images'].map(d => path.join(ROOT, d));

const BASICS = new Set(['copper', 'silver', 'gold', 'platinum', 'estate', 'duchy', 'province', 'colony', 'curse']);
const LANDSCAPES = ['event', 'landmark', 'project', 'way', 'ally', 'trait', 'prophecy', 'boon', 'hex', 'state', 'artifact'];

const present = new Set<string>();
for (const dir of IMAGE_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
        const m = f.match(/^(.+)\.(jpg|png)$/i);
        if (m) present.add(m[1]);
    }
}

const kind = (id: string, types: string[]) =>
    BASICS.has(id) ? 'carré' : types.some(t => LANDSCAPES.includes(String(t).toLowerCase())) ? 'paysage' : 'standard';

const clean = (s?: string) => (s ?? '').replace(/\s+/g, ' ').trim();

const all = Object.values(CardRegistry.getAll()).filter(c => c.id && !c.id.startsWith('pile') && c.id !== 'back');
const missing = all.filter(c => !present.has(c.id));

const byExp = new Map<string, typeof missing>();
for (const c of missing) {
    const e = getCardExpansion(c) ?? 'autre';
    if (!byExp.has(e)) byExp.set(e, []);
    byExp.get(e)!.push(c);
}
const order = [...EXPANSION_IDS, 'autre'] as string[];

let md = `# Images de cartes manquantes\n\n`;
md += `${missing.length} images manquantes sur ${all.length} cartes (générée par \`npx tsx scripts/tools/list-missing-images.ts\`).\n\n`;
md += `Format : voir [IMAGES.md](IMAGES.md). Nom du fichier = colonne **Fichier** + \`.jpg\` (ou \`.png\`).\n\n`;
for (const e of order) {
    const list = byExp.get(e);
    if (!list?.length) continue;
    md += `## ${(EXPANSION_LABELS as any)[e] ?? e} (${list.length})\n\n| Fichier | Nom | Types | Format |\n|---|---|---|---|\n`;
    for (const c of list.sort((a, b) => a.id.localeCompare(b.id))) {
        md += `| \`${c.id}\` | ${c.name} | ${c.types.map(t => String(t).toLowerCase()).join(', ')} | ${kind(c.id, c.types)} |\n`;
    }
    md += '\n';
}

const csvCell = (s: string) => `"${s.replace(/"/g, '""')}"`;
let csv = 'fichier;nom;extension;types;format;texte\n';
for (const e of order) for (const c of (byExp.get(e) ?? [])) {
    csv += [c.id, c.name, (EXPANSION_LABELS as any)[e] ?? e, c.types.map(t => String(t).toLowerCase()).join(' '), kind(c.id, c.types), clean(c.description)].map(csvCell).join(';') + '\n';
}

const out = path.join(ROOT, 'docs/images');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'IMAGES_MANQUANTES.md'), md);
fs.writeFileSync(path.join(out, 'images-manquantes.csv'), '﻿' + csv);
console.log(`${missing.length} manquantes / ${all.length} cartes, ${present.size} images trouvées`);
