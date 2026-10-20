/**
 * Audit : types d'effets utilisés par les cartes mais qu'aucun gestionnaire ne traite.
 * Un tel effet ne fait RIEN en jeu (aucune erreur visible).
 *
 * Usage : npx tsx scripts/audit/effect_types.ts
 */
import { registerDefaultPhases } from '../../shared/engine/registerCorePhases.js';
import { registerCoreEffects } from '../../shared/engine/registerCoreEffects.js';
import { registerAllExpansions } from '../../shared/engine/registerExpansions.js';
import { CardRegistry } from '../../shared/cards/index.js';
import { EffectHandlerRegistry } from '../../shared/engine/EffectHandlerRegistry.js';
import { LandscapeRegistry } from '../../shared/cards/landscapes/index.js';

const silence = console.log;
console.log = () => {};
registerDefaultPhases();
registerCoreEffects();
registerAllExpansions();
console.log = silence;

// Types handled directly by EffectEngine.applyEffect (not through the registry)
const ENGINE_INTERNAL = new Set(['SYSTEM_ORDER_TRIGGERS', 'RESOLVE_ATTACK']);
// Keys whose object values carry a `type` that is NOT an effect
const NON_EFFECT_KEYS = new Set(['amount', 'reactionCondition', 'filter', 'condition', 'cost', 'mixedPile',
    'value', 'maxCost', 'minCost', 'count', 'buyRestriction', 'restriction', 'requirement', 'payload']);

const missing = new Map<string, Set<string>>(); // type -> card ids

function walk(node: any, cardId: string, parentKey: string, seen: Set<any>) {
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) { node.forEach(n => walk(n, cardId, parentKey, seen)); return; }

    if (typeof node.type === 'string' && !NON_EFFECT_KEYS.has(parentKey)) {
        const t = node.type;
        if (!EffectHandlerRegistry.has(t) && !ENGINE_INTERNAL.has(t)) {
            if (!missing.has(t)) missing.set(t, new Set());
            missing.get(t)!.add(cardId);
        }
    }
    for (const [k, v] of Object.entries(node)) {
        if (k === 'types') continue;
        walk(v, cardId, k, seen);
    }
}

const sources: [string, any][] = [
    ...Object.values(CardRegistry.getAll()).map(c => [c.id, c] as [string, any]),
    ...((LandscapeRegistry as any).getAll?.() ?? []).map((l: any) => [l.id, l] as [string, any]),
];
for (const [id, def] of sources) {
    for (const [k, v] of Object.entries(def)) {
        if (k === 'types') continue;
        walk(v, id, k, new Set());
    }
}

const rows = [...missing.entries()].sort((a, b) => b[1].size - a[1].size);
for (const [t, ids] of rows) console.log(`${t.padEnd(32)} ${String(ids.size).padStart(3)}  ${[...ids].slice(0, 8).join(', ')}${ids.size > 8 ? ', …' : ''}`);
console.log(`\n${rows.length} types d'effets sans gestionnaire.`);
