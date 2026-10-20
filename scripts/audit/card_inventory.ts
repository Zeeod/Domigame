/**
 * Inventaire des cartes : nombre par extension + artworks manquants.
 * Usage : npx tsx scripts/audit/card_inventory.ts
 * Écrit la liste complète dans logs/card_inventory.json
 */
import fs from 'fs';
import path from 'path';
import { registerDefaultPhases } from '../../shared/engine/registerCorePhases.js';
import { registerCoreEffects } from '../../shared/engine/registerCoreEffects.js';
import { registerAllExpansions } from '../../shared/engine/registerExpansions.js';
import { CardRegistry } from '../../shared/cards/index.js';

registerDefaultPhases();
registerCoreEffects();
registerAllExpansions();

const imgDir = path.resolve('client/public/card-images');
const hasImage = (id: string) => ['jpg', 'png'].some((e) => fs.existsSync(path.join(imgDir, `${id}.${e}`)));

const byExp: Record<string, { total: number; withArt: number; missing: string[]; types: Record<string, number> }> = {};
for (const card of Object.values(CardRegistry.getAll())) {
    const exp = (card as any).expansion || 'inconnue';
    const e = (byExp[exp] ??= { total: 0, withArt: 0, missing: [], types: {} });
    e.total++;
    const main = card.types?.[0] ?? '?';
    e.types[main] = (e.types[main] || 0) + 1;
    if (hasImage(card.id)) e.withArt++;
    else e.missing.push(card.id);
}

let t = 0, a = 0;
for (const [exp, e] of Object.entries(byExp).sort((x, y) => y[1].total - x[1].total)) {
    t += e.total; a += e.withArt;
    console.log(`${exp.padEnd(16)} ${String(e.total).padStart(4)} cartes  ${String(e.withArt).padStart(3)} avec artwork   ${JSON.stringify(e.types)}`);
}
console.log(`TOTAL ${t} cartes, ${a} avec artwork, ${t - a} sans`);
fs.mkdirSync('logs', { recursive: true });
fs.writeFileSync('logs/card_inventory.json', JSON.stringify(byExp, null, 2));
