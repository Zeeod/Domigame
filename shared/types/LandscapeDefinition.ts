import { EffectDefinition } from './EffectDefinition.js';

export type LandscapeType = 'EVENT' | 'WAY' | 'LANDMARK' | 'PROJECT' | 'TRAIT' | 'ALLY' | 'PROPHECY' | 'BOON' | 'HEX';

export interface LandscapeDefinition {
    id: string;
    name: string;
    types: LandscapeType[];
    cost?: { coin?: number; debt?: number; potion?: number };
    description?: string;
    text?: string;

    // Effects
    onBuy?: EffectDefinition[];      // Events/Projects
    onPlay?: EffectDefinition[];     // Ways / Allies (Usage)
    setupEffects?: EffectDefinition[]; // Traits
    onScore?: EffectDefinition[];    // Landmarks
    onTurnStart?: EffectDefinition[]; // Prophecies / Projects / Events
    fulfillmentEffects?: EffectDefinition[]; // Prophecies

    // Configuration
    expansion: string;
    setupRequirements?: any; // E.g., Allies require Liaisons
    favorCost?: number; // Allies

    /** Condition to remove a Sun token from this Prophecy (Rising Sun) */
    prophecyTrigger?: {
        event: 'GAIN_CARD' | 'BUY_CARD' | 'TRASH_CARD' | 'PLAY_CARD';
        filter?: any;
    };
}
