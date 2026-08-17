import { CardRegistry } from './shared/cards/index.js';

const candidates = CardRegistry.getFullBaseKingdom();
const costMap: Record<number, string[]> = {};

candidates.forEach(id => {
    const def = CardRegistry.get(id);
    if (def) {
        if (!costMap[def.cost]) costMap[def.cost] = [];
        costMap[def.cost].push(id);
    }
});

console.log(JSON.stringify(costMap, null, 2));
