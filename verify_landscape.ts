import { SupplyGenerator } from './shared/engine/SupplyGenerator.js';

const landscapes = SupplyGenerator.getLandscapes({
    enabledExpansions: ['base', 'empires'],
    landscapeInstructions: []
});

console.log('LANDSCAPES_COUNT:' + landscapes.length);
