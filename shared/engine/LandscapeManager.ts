import { GameState } from './GameState.js';
import { LandscapeType } from '../types/LandscapeDefinition.js';
import { LandscapeRegistry } from '../cards/landscapes/index.js';

export class LandscapeManager {
    static getActiveLandscapes(state: GameState): string[] {
        return state.landscapes || [];
    }

    static getLandscapesByType(state: GameState, type: LandscapeType): string[] {
        return (state.landscapes || []).filter(id => {
            const def = LandscapeRegistry.get(id);
            return def?.types.includes(type);
        });
    }

    // ... Hooks will be added here
}
