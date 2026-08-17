import { LandscapeDefinition } from '../../types/LandscapeDefinition.js';
import { LandscapeRegistry } from '../../cards/landscapes/index.js';
import { RisingSunLandscapes } from './RisingSunCards.js';

export class LandscapeExamples {
    static register() {
        RisingSunLandscapes.register();
        // Event: Alms (Adventures) - Cost 0. Once per turn: if you have no buys, gain a card costing up to 4.
        const alms: LandscapeDefinition = {
            id: 'alms',
            name: 'Aumône',
            types: ['EVENT'],
            cost: { coin: 0 },
            expansion: 'Adventures',
            onBuy: [
                {
                    type: 'ADD_MONEY',
                    amount: 1
                }
            ]
        };
        LandscapeRegistry.register(alms);

        // Way: Way of the Sheep (Menagerie) - +2 Coins
        const waySheep: LandscapeDefinition = {
            id: 'way_of_the_sheep',
            name: 'Voie du Mouton',
            types: ['WAY'],
            expansion: 'Menagerie',
            onPlay: [{
                type: 'ADD_MONEY', // Correct type
                amount: 2
            }]
        };
        LandscapeRegistry.register(waySheep);

        // Project: Star Chart (Renaissance) - Cost 3. At start of turn, look at top card...
        // ...

        console.log('[LandscapeExamples] Registered sample landscapes.');
    }
}
