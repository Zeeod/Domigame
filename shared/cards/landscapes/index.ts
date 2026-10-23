import { LandscapeDefinition } from '../../types/LandscapeDefinition.js';
import { CardRegistry } from '../index.js';

const LANDSCAPE_TYPES = ['EVENT', 'PROJECT', 'LANDMARK', 'WAY', 'ALLY', 'PROPHECY', 'TRAIT'];

export class LandscapeRegistry {
    private static landscapes = new Map<string, LandscapeDefinition>();

    static register(landscape: LandscapeDefinition) {
        if (this.landscapes.has(landscape.id)) {
            console.warn(`[LandscapeRegistry] Overwriting landscape: ${landscape.id}`);
        }
        this.landscapes.set(landscape.id, landscape);
    }

    static get(id: string): LandscapeDefinition | undefined {
        const own = this.landscapes.get(id);
        if (own) return own;
        // Landscapes defined as cards (CardRegistry): adapt the cost shape
        const c: any = CardRegistry.get(id);
        if (!c || !c.types?.some((t: string) => LANDSCAPE_TYPES.includes(t))) return undefined;
        return { ...c, cost: { coin: c.cost || 0, debt: c.debtCost || 0, potion: c.potionCost || 0 } } as LandscapeDefinition;
    }

    static getAll(): LandscapeDefinition[] {
        return Array.from(this.landscapes.values());
    }

    static reset(): void {
        this.landscapes.clear();
    }
}
