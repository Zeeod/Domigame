import { ExpansionModule } from '../ExpansionLoader.js';
import { MenagerieCards } from '../../cards/menagerie/index.js';
import { MenagerieLandscapes } from '../../cards/landscapes/MenagerieLandscapes.js';

/** Menagerie cards and Ways. The rules live in MenagerieRules.ts. */
export const MenagerieModule: ExpansionModule = {
    id: 'menagerie',
    name: 'Ménagerie',
    cards: Object.values(MenagerieCards),
    landscapes: [],
    onLoad: () => {
        MenagerieLandscapes.register();
    }
};
