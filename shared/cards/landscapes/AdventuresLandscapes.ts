import { LandscapeRegistry } from './index.js';
import * as Events from '../adventures/events.js';

export class AdventuresLandscapes {
    static register() {
        Object.values(Events).forEach(e => {
            if (e && typeof e === 'object' && 'id' in e && (e as any).types?.includes('EVENT')) {
                LandscapeRegistry.register(e as any);
            }
        });
        console.log('[AdventuresLandscapes] Registered Adventures events.');
    }
}
