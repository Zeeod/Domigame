import { RisingSunLandscapes } from './RisingSunCards.js';
import { AdventuresLandscapes } from './AdventuresLandscapes.js';
import { LandscapeExamples } from './LandscapeExamples.js';
import { MenagerieLandscapes } from './MenagerieLandscapes.js';

/**
 * Register ALL landscapes (Events, Projects, Ways, Landmarks, Prophecies)
 * across all expansions.
 */
export function registerAllLandscapes(): void {
    // Basic Examples (contains some from various expansions)
    LandscapeExamples.register();

    // Expansion specific registrations
    RisingSunLandscapes.register();
    AdventuresLandscapes.register();
    MenagerieLandscapes.register();

    // TODO: Add other expansions as they are implemented
    // RenaissanceLandscapes.register();
    // EmpiresLandscapes.register();
}
