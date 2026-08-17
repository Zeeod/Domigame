import { LandscapeDefinition } from '../../types/LandscapeDefinition.js';

export class LandscapeRegistry {
    private static landscapes = new Map<string, LandscapeDefinition>();

    static register(landscape: LandscapeDefinition) {
        if (this.landscapes.has(landscape.id)) {
            console.warn(`[LandscapeRegistry] Overwriting landscape: ${landscape.id}`);
        }
        this.landscapes.set(landscape.id, landscape);
    }

    static get(id: string): LandscapeDefinition | undefined {
        return this.landscapes.get(id);
    }

    static getAll(): LandscapeDefinition[] {
        return Array.from(this.landscapes.values());
    }

    static reset(): void {
        this.landscapes.clear();
    }
}
