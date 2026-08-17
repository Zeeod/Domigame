import { CardRegistry } from '../../shared/cards/index.js';

const alliesCards = [
    // Kingdom Cards (Liaisons & regular)
    'barbarian', 'bauble', 'broker', 'capital_city', 'carpenter', 'contract', 'courier', 'emissary',
    'galleria', 'guildmaster', 'highwayman', 'hunter', 'importer', 'innkeeper', 'marquis', 'merchant_camp',
    'modify', 'royal_galley', 'sentinel', 'skirmisher', 'specialist', 'swap', 'sycophant', 'town', 'underling',

    // Split Piles - Augurs
    'herb_gatherer', 'acolyte', 'sorceress', 'sibyl',
    // Split Piles - Clashes
    'battle_plan', 'archer', 'warlord', 'territory',
    // Split Piles - Forts
    'tent', 'garrison', 'hill_fort', 'stronghold',
    // Split Piles - Odysseys
    'old_map', 'voyage', 'sunken_treasure', 'distant_shore',
    // Split Piles - Townsfolk
    'town_crier', 'blacksmith', 'miller', 'elder',
    // Split Piles - Wizards
    'student', 'conjurer', 'sorcerer_wizard', 'lich',

    // Virtual Piles
    'augurs_pile', 'clashes_pile', 'forts_pile', 'odysseys_pile', 'townsfolk_pile', 'wizards_pile',

    // Ally Landscape Cards
    'architects_guild', 'band_of_nomads', 'cave_dwellers', 'circle_of_witches', 'city_state', 'coastal_haven',
    'crafters_guild', 'desert_guides', 'family_of_inventors', 'fellowship_of_scribes', 'forest_dwellers',
    'gang_of_pickpockets', 'island_folk', 'league_of_bankers', 'league_of_shopkeepers', 'market_towns',
    'mountain_folk', 'order_of_astrologers', 'order_of_masons', 'peaceful_cult', 'plateau_shepherds',
    'trappers_lodge', 'woodcarvers_guild'
];

import * as fs from 'fs';

console.log('Verifying Allies expansion registration (Full List)...');
let missing = 0;
const missingNames: string[] = [];
alliesCards.forEach(id => {
    const card = CardRegistry.get(id);
    if (!card) {
        missingNames.push(id);
        missing++;
    }
});

if (missing === 0) {
    console.log(`Successfully verified all ${alliesCards.length} Allies cards!`);
    if (fs.existsSync('missing_allies.txt')) fs.unlinkSync('missing_allies.txt');
} else {
    console.log(`Failed verify: ${missing} cards missing. Check missing_allies.txt`);
    fs.writeFileSync('missing_allies.txt', missingNames.join('\n'));
    process.exit(1);
}
