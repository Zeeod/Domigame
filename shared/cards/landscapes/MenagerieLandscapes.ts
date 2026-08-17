
import { LandscapeRegistry } from './index.js';
import * as Ways from '../menagerie/ways.js';

/**
 * Register all Menagerie landscapes (Ways, Events).
 */
export class MenagerieLandscapes {
    static register() {
        // Ways
        LandscapeRegistry.register(Ways.WayOfTheButterfly);
        LandscapeRegistry.register(Ways.WayOfTheCamel);
        LandscapeRegistry.register(Ways.WayOfTheChameleon);
        LandscapeRegistry.register(Ways.WayOfTheFrog);
        LandscapeRegistry.register(Ways.WayOfTheGoat);
        LandscapeRegistry.register(Ways.WayOfTheHorse);
        LandscapeRegistry.register(Ways.WayOfTheMole);
        LandscapeRegistry.register(Ways.WayOfTheMonkey);
        LandscapeRegistry.register(Ways.WayOfTheMouse);
        LandscapeRegistry.register(Ways.WayOfTheMule);
        LandscapeRegistry.register(Ways.WayOfTheOtter);
        LandscapeRegistry.register(Ways.WayOfTheOwl);
        LandscapeRegistry.register(Ways.WayOfTheOx);
        LandscapeRegistry.register(Ways.WayOfThePig);
        LandscapeRegistry.register(Ways.WayOfTheRat);
        LandscapeRegistry.register(Ways.WayOfTheSeal);
        LandscapeRegistry.register(Ways.WayOfTheSheep);
        LandscapeRegistry.register(Ways.WayOfTheSquirrel);
        LandscapeRegistry.register(Ways.WayOfTheTurtle);
        LandscapeRegistry.register(Ways.WayOfTheWorm);

        // TODO: Add Menagerie Events (e.g. Alliance, Banish, Bargain, Commerce, Delay, Desperation, Enclave, Enhance, Gamble, Invest, March, Populate, Pursue, Reaping, Ride, Seize the Day, Toil, Transport)
        
        console.log('[MenagerieLandscapes] Registered Menagerie landscapes.');
    }
}
