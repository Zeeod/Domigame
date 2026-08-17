/**
 * registerExpansions - Bootstrap file that loads all expansion modules
 * 
 * Import this file at game start (or at the top of the server entry point)
 * to register all expansion-specific mechanics.
 */

import { ExpansionLoader } from './ExpansionLoader.js';
import { BaseModule } from './expansions/Base.js';
import { ProsperityModule } from './expansions/Prosperity.js';
import { GuildsModule } from './expansions/Guilds.js';
import { RenaissanceModule } from './expansions/Renaissance.js';
import { NocturneModule } from './expansions/Nocturne.js';
import { SeasideModule } from './expansions/Seaside.js';
import { PlunderModule } from './expansions/Plunder.js';
import { RisingSunModule } from './expansions/RisingSun.js';
import { MenagerieModule } from './expansions/Menagerie.js';
import { PromoModule } from './expansions/Promo.js';
import './registerCoreEffects.js';
import './registerCorePhases.js';
import { registerAllLandscapes } from '../cards/landscapes/registerLandscapes.js';

/**
 * Register all expansion modules.
 * Call this once at application start.
 */
export function registerAllExpansions(): void {
    registerAllLandscapes();
    ExpansionLoader.load(BaseModule);
    ExpansionLoader.load(ProsperityModule);
    ExpansionLoader.load(GuildsModule);
    ExpansionLoader.load(RenaissanceModule);
    ExpansionLoader.load(NocturneModule);
    ExpansionLoader.load(SeasideModule);
    ExpansionLoader.load(PlunderModule);
    ExpansionLoader.load(RisingSunModule);
    ExpansionLoader.load(MenagerieModule);
    ExpansionLoader.load(PromoModule);
}

// Auto-register on import
registerAllExpansions();
