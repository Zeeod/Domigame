import { CardRegistry } from '../../shared/cards/index.js';
import * as fs from 'fs';

const promoCards = [
    'black_market', 'envoy', 'walled_village', 'governor', 'stash', 'prince',
    'summon', 'sauna', 'avanto', 'sauna_avanto_pile', 'dismantling', 'captain',
    'church', 'marchland'
];

const plunderCards = [
    'abundance', 'buried_treasure', 'cabin_boy', 'crew', 'crucible', 'cutthroat',
    'enlarge', 'figurine', 'first_mate', 'flagship', 'fortune_hunter', 'frigate',
    'gondola', 'grotto', 'harbor_village', 'jewelled_egg', 'kings_cache',
    'landing_party', 'longship', 'mapmaker', 'maroon', 'mining_road', 'pendant',
    'pickaxe', 'pilgrim', 'quartermaster', 'rope', 'sack_of_loot', 'search',
    'secluded_shrine', 'shaman', 'silver_mine', 'siren', 'stowaway', 'swamp_shacks',
    'taskmaster', 'tools', 'trickster', 'wealthy_village',
    // Loot
    'amphora', 'doubloons', 'endless_chalice', 'figurehead', 'hammer', 'insignia',
    'jewels', 'orb', 'prize_goat', 'puzzle_box', 'sextant', 'shield', 'spell_scroll',
    'staff', 'sword', 'loot_pile',
    // Traits
    'cheap', 'cursed', 'fated', 'fawning', 'friendly', 'hasty', 'inherited',
    'inspiring', 'nearby', 'patient', 'pious', 'reckless', 'rich', 'shy', 'tireless',
    // Events
    'avoid', 'bury', 'deliver', 'foray', 'invasion', 'journey', 'launch',
    'looting', 'maelstrom', 'mirror', 'peril', 'prepare', 'prosper', 'rush', 'scrounge'
];

const risingSunCards = [
    'aristocrat', 'tea_house', 'rice_broker', 'imperial_envoy', 'kitsune',
    'ninja', 'ronin', 'samurai',
    // Prophecies
    'omens', 'famine', 'war', 'plague', 'prosperity_prophecy', 'renewal'
];

const allNewCards = [...promoCards, ...plunderCards, ...risingSunCards];

console.log(`Verifying registration for ${allNewCards.length} new cards...`);

const missing = allNewCards.filter(id => !CardRegistry.get(id));

if (missing.length === 0) {
    console.log("Successfully verified all new cards!");
} else {
    console.error(`Missing ${missing.length} cards:`, missing);
    fs.writeFileSync('missing_remaining_cards.txt', missing.join('\n'));
}
