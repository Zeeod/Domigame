/**
 * Base Expansion Module
 *
 * Note: player.costReduction (Bridge, Highway…) is applied once, directly in
 * EconomyEngine.getCardCost — do not register a modifier for it here.
 */

import { ExpansionModule } from '../ExpansionLoader.js';

export const BaseModule: ExpansionModule = {
    id: 'base',
    name: 'Base',
    costModifiers: []
};
