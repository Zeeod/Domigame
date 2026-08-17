
import { ExpansionModule } from '../ExpansionLoader.js';
import { MenagerieCards } from '../../cards/menagerie/index.js';
import { MenagerieLandscapes } from '../../cards/landscapes/MenagerieLandscapes.js';
import { MenagerieEffectHandler } from '../effects/MenagerieEffectHandler.js';

export const MenagerieModule: ExpansionModule = {
    id: 'menagerie',
    name: 'Ménagerie',
    cards: Object.values(MenagerieCards),
    landscapes: [], // Registered separately via MenagerieLandscapes for now, but can be added here
    onLoad: () => {
        MenagerieEffectHandler.register();
        MenagerieLandscapes.register();
    }
};
