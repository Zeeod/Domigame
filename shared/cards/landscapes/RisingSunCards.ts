import { LandscapeRegistry } from './index.js';
import * as Prophecies from '../rising_sun/prophecies.js';

export class RisingSunLandscapes {
    static register() {
        // Register all prophecies from prophecies.ts
        Object.values(Prophecies).forEach(p => {
            if (p && typeof p === 'object' && 'id' in p && p.types?.includes('PROPHECY')) {
                LandscapeRegistry.register(p as any);
            }
        });

        console.log('[RisingSunLandscapes] Registered Rising Sun prophecies.');
    }
}
