import { setAutoFreeze } from 'immer';

// Disable Immer auto-freeze globally for tests
// Many tests in this codebase mutate the GameState directly after receiving it from ActionResolver or GameRoom,
// which throws errors if auto-freeze is enabled.
setAutoFreeze(false);

import { ExpansionLoader } from '../shared/engine/ExpansionLoader.js';
import { registerAllExpansions } from '../shared/engine/registerExpansions.js';
import { registerDefaultPhases } from '../shared/engine/registerCorePhases.js';
import { registerCoreEffects } from '../shared/engine/registerCoreEffects.js';
import { beforeEach } from 'vitest';

beforeEach(() => {
    // Reset all static registries
    ExpansionLoader.reset();
    // Re-register everything (Core first, then Expansions)
    registerDefaultPhases();
    registerCoreEffects();
    registerAllExpansions();
});
