import { LandscapeDefinition } from '../../types/LandscapeDefinition.js';
import { LandscapeRegistry } from './index.js';

export class TraitExamples {
    static register() {
        // Trait: Cheap (Plunder) - Cards from this pile cost 1 less.
        const cheap: LandscapeDefinition = {
            id: 'cheap',
            name: 'Bon Marché',
            types: ['TRAIT'],
            expansion: 'Plunder',
            // Effects are handled in getCardCost directly for simplicity
        };
        LandscapeRegistry.register(cheap);

        // Trait: Pious (Plunder) - When you gain a card from this pile, you may trash a card from your hand.
        const pious: LandscapeDefinition = {
            id: 'pious',
            name: 'Pieux',
            types: ['TRAIT'],
            expansion: 'Plunder',
            onBuy: [{ // Actually onGain? Traits triggers are tricky. "When you gain..."
                type: 'TRASH',
                source: 'hand',
                min: 0,
                max: 1,
                message: 'Pieux: Vous pouvez écarter une carte de votre main.'
            }]
        };
        LandscapeRegistry.register(pious);
    }
}
