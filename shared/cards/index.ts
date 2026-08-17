/**
 * Cards Index - Card Registry
 * 
 * Central registry for all card definitions.
 * All cards are strictly defined in TypeScript.
 */

import { CardDefinition } from '../types/CardDefinition.js';

// Base Set Cards - Treasures
import { copper } from './base/copper.js';
import { silver } from './base/silver.js';
import { gold } from './base/gold.js';

// Base Set Cards - Victory
import { estate } from './base/estate.js';
import { duchy } from './base/duchy.js';
import { province } from './base/province.js';
import { gardens } from './base/gardens.js';
import { curse } from './base/curse.js';

// Base Set Cards - Actions (Simple)
import { village } from './base/village.js';
import { smithy } from './base/smithy.js';
import { market } from './base/market.js';
import { militia } from './base/militia.js';
import { chapel } from './base/chapel.js';
import { cellar } from './base/cellar.js';
import { moat } from './base/moat.js';
import { workshop } from './base/workshop.js';
import { moneylender } from './base/moneylender.js';
import { witch } from './base/witch.js';
import { festival } from './base/festival.js';
import { laboratory } from './base/laboratory.js';

// Base Set Cards - Actions (Complex)
import { bureaucrat } from './base/bureaucrat.js';
import { councilRoom } from './base/councilRoom.js';
import { remodel } from './base/remodel.js';
import { throneRoom } from './base/throneRoom.js';
import { library } from './base/library.js';

// Base Set Cards - 2nd Edition New Cards
import { mine } from './base/mine.js';
import { harbinger } from './base/harbinger.js';
import { merchant } from './base/merchant.js';
import { vassal } from './base/vassal.js';
import { poacher } from './base/poacher.js';
import { bandit } from './base/bandit.js';
import { sentry } from './base/sentry.js';
import { artisan } from './base/artisan.js';

// Intrigue expansion
import { pawn } from './intrigue/pawn.js';
import { nobles } from './intrigue/nobles.js';
import { steward } from './intrigue/steward.js';
import { courtier } from './intrigue/courtier.js';
import { mill } from './intrigue/mill.js';
import { shanty_town } from './intrigue/shanty_town.js';
import { mining_village } from './intrigue/mining_village.js';
import { bridge } from './intrigue/bridge.js';
import { conspirator } from './intrigue/conspirator.js';
import { courtyard } from './intrigue/courtyard.js';
import { swindler } from './intrigue/swindler.js';
import { wishing_well } from './intrigue/wishing_well.js';
import { baron } from './intrigue/baron.js';
import { ironworks } from './intrigue/ironworks.js';
import { secret_passage } from './intrigue/secret_passage.js';
import { diplomat } from './intrigue/diplomat.js';
import { lurker } from './intrigue/lurker.js';
import { masquerade } from './intrigue/masquerade.js';
import { minion } from './intrigue/minion.js';
import { patrol } from './intrigue/patrol.js';
import { remplacement } from './intrigue/remplacement.js';
import { torturer } from './intrigue/torturer.js';
import { trading_post } from './intrigue/trading_post.js';
import { upgrade } from './intrigue/upgrade.js';
import { duke } from './intrigue/duke.js';
import { farm } from './intrigue/farm.js';

// Seaside expansion
import { caravan } from './seaside/caravan.js';
import { merchantShip } from './seaside/merchant_ship.js';
import { wharf } from './seaside/wharf.js';
import { haven } from './seaside/haven.js';
import { island } from './seaside/island.js';
import { lighthouse } from './seaside/lighthouse.js';
import { smugglers } from './seaside/smugglers.js';
import { nativeVillage } from './seaside/native_village.js';
import { fishingVillage } from './seaside/fishing_village.js';
import { salvager } from './seaside/salvager.js';
import { treasureMap } from './seaside/treasure_map.js';
import { lookout } from './seaside/lookout.js';
import { seaWitch } from './seaside/sea_witch.js';
import { cutpurse } from './seaside/cutpurse.js';
import { bazaar } from './seaside/bazaar.js';
import { outpost } from './seaside/outpost.js';
import { tactician } from './seaside/tactician.js';
import { treasury } from './seaside/treasury.js';
import { warehouse } from './seaside/warehouse.js';

// Seaside 2nd Edition New Cards
import { astrolabe } from './seaside/astrolabe.js';
import { blockade } from './seaside/blockade.js';
import { corsair } from './seaside/corsair.js';
import { monkey } from './seaside/monkey.js';
import { pirate } from './seaside/pirate.js';
import { sailor } from './seaside/sailor.js';
import { seaChart } from './seaside/sea_chart.js';
import { tidePools } from './seaside/tide_pools.js';

// Prosperity expansion
import { platinum } from './prosperity/platinum.js';
import { colony } from './prosperity/colony.js';
import { bishop } from './prosperity/bishop.js';
import { watchtower } from './prosperity/watchtower.js';
import { anvil } from './prosperity/anvil.js';
import { bank } from './prosperity/bank.js';
import { city } from './prosperity/city.js';
import { clerk } from './prosperity/clerk.js';
import { magnate } from './prosperity/magnate.js';
import { workersVillage } from './prosperity/workers_village.js';
import { charlatan } from './prosperity/charlatan.js';
import { collection } from './prosperity/collection.js';
import { crystalBall } from './prosperity/crystal_ball.js';
import { expand } from './prosperity/expand.js';
import { forge } from './prosperity/forge.js';
import { grandMarket } from './prosperity/grand_market.js';
import { hoard } from './prosperity/hoard.js';
import { investment } from './prosperity/investment.js';
import { kingsCourt } from './prosperity/kings_court.js';
import { mint } from './prosperity/mint.js';
import { monument } from './prosperity/monument.js';
import { peddler } from './prosperity/peddler.js';
import { quarry } from './prosperity/quarry.js';
import { rabble } from './prosperity/rabble.js';
import { tiara } from './prosperity/tiara.js';
import { vault } from './prosperity/vault.js';
import { warChest } from './prosperity/war_chest.js';

// Dark Ages expansion - Individual card files
import { spoils } from './dark_ages/spoils.js';
import { cultist } from './dark_ages/cultist.js';
import { rats } from './dark_ages/rats.js';
import { altar } from './dark_ages/altar.js';
import { sage } from './dark_ages/sage.js';
import { marauder } from './dark_ages/marauder.js';
import { pillage } from './dark_ages/pillage.js';
import { armory } from './dark_ages/armory.js';
import { beggar } from './dark_ages/beggar.js';
import { forager } from './dark_ages/forager.js';
import { fortress } from './dark_ages/fortress.js';
import { junkDealer as junk_dealer } from './dark_ages/junk_dealer.js';
import { marketSquare as market_square } from './dark_ages/market_square.js';
import { poorHouse as poor_house } from './dark_ages/poor_house.js';
import { scavenger } from './dark_ages/scavenger.js';
import { squire } from './dark_ages/squire.js';
import { storeroom } from './dark_ages/storeroom.js';
import { vagrant } from './dark_ages/vagrant.js';
import { wanderingMinstrel as wandering_minstrel } from './dark_ages/wandering_minstrel.js';
import { banditCamp as bandit_camp } from './dark_ages/bandit_camp.js';
import { counterfeit } from './dark_ages/counterfeit.js';
import { deathCart as death_cart } from './dark_ages/death_cart.js';
import { feodum } from './dark_ages/feodum.js';
import { ironmonger } from './dark_ages/ironmonger.js';
import { mystic } from './dark_ages/mystic.js';
import { bandOfMisfits as band_of_misfits } from './dark_ages/band_of_misfits.js';
import { catacombs } from './dark_ages/catacombs.js';
import { count } from './dark_ages/count.js';
import { graverobber } from './dark_ages/graverobber.js';
import { hermit } from './dark_ages/hermit.js';
import { huntingGrounds as hunting_grounds } from './dark_ages/hunting_grounds.js';
import { procession } from './dark_ages/procession.js';
import { rebuild } from './dark_ages/rebuild.js';
import { rogue } from './dark_ages/rogue.js';
import { urchin } from './dark_ages/urchin.js';
import { madman } from './dark_ages/madman.js';
import { mercenary } from './dark_ages/mercenary.js';
import { Shelters } from './dark_ages/Shelters.js';
import { Ruins } from './dark_ages/Ruins.js';
import { Knights } from './dark_ages/Knights.js';

// Hinterlands expansion - Individual card files
import { crossroads } from './hinterlands/crossroads.js';
import { duchess } from './hinterlands/duchess.js';
import { nomadCamp } from './hinterlands/nomad_camp.js';
import { develop } from './hinterlands/develop.js';
import { oasis } from './hinterlands/oasis.js';
import { tunnel } from './hinterlands/tunnel.js';
import { jackOfAllTrades } from './hinterlands/jack_of_all_trades.js';
import { spiceMerchant } from './hinterlands/spice_merchant.js';
import { trader } from './hinterlands/trader.js';
import { highway } from './hinterlands/highway.js';
import { cartographer } from './hinterlands/cartographer.js';
import { inn } from './hinterlands/inn.js';
import { margrave } from './hinterlands/margrave.js';
import { stables } from './hinterlands/stables.js';
import { borderVillage } from './hinterlands/border_village.js';
import { farmland } from './hinterlands/farmland.js';
import { haggler } from './hinterlands/haggler.js';
import { oracle } from './hinterlands/oracle.js';
import { scheme } from './hinterlands/scheme.js';
import { mandarin } from './hinterlands/mandarin.js';
import { embassy } from './hinterlands/embassy.js';
import { cache } from './hinterlands/cache.js';

// Cornucopia expansion - Individual card files
import { hamlet } from './cornucopia/hamlet.js';
import { fortuneTeller } from './cornucopia/fortune_teller.js';
import { menagerie } from './cornucopia/menagerie.js';
import { farmingVillage } from './cornucopia/farming_village.js';
import { horseTraders } from './cornucopia/horse_traders.js';
import { remake } from './cornucopia/remake.js';
import { tournament } from './cornucopia/tournament.js';
import { youngWitch } from './cornucopia/young_witch.js';
import { harvest } from './cornucopia/harvest.js';
import { hornOfPlenty } from './cornucopia/horn_of_plenty.js';
import { huntingParty } from './cornucopia/hunting_party.js';
import { jester } from './cornucopia/jester.js';
import { fairgrounds } from './cornucopia/fairgrounds.js';
import { BagOfGold, Diadem, Followers, Princess, TrustySteed } from './cornucopia/prizes.js';

// Alchemy
import {
    Potion, Alchemist, Apothecary, Apprentice, ScryingPool, Familiar, Golem, Herbalist, PhilosophersStone, Possession, Transmute, University, Vineyard
} from './alchemy/index.js';

// Guilds expansion - Individual card files
import { candlestickMaker } from './guilds/candlestick_maker.js';
import { stonemason } from './guilds/stonemason.js';
import { doctor } from './guilds/doctor.js';
import { masterpiece } from './guilds/masterpiece.js';
import { advisor } from './guilds/advisor.js';
import { plaza } from './guilds/plaza.js';
import { taxman } from './guilds/taxman.js';
import { herald } from './guilds/herald.js';
import { baker } from './guilds/baker.js';
import { butcher } from './guilds/butcher.js';
import { journeyman } from './guilds/journeyman.js';
import { merchantGuild } from './guilds/merchant_guild.js';
import { soothsayer } from './guilds/soothsayer.js';

// Adventures expansion - Individual card files
import { coinOfTheRealm } from './adventures/coin_of_the_realm.js';
import { page } from './adventures/page.js';
import { peasant } from './adventures/peasant.js';
import { ratcatcher } from './adventures/ratcatcher.js';
import { raze } from './adventures/raze.js';
import { amulet } from './adventures/amulet.js';
import { caravanGuard } from './adventures/caravan_guard.js';
import { dungeon } from './adventures/dungeon.js';
import { gear } from './adventures/gear.js';
import { guide } from './adventures/guide.js';
import { duplicate } from './adventures/duplicate.js';
import { magpie } from './adventures/magpie.js';
import { messenger } from './adventures/messenger.js';
import { miser } from './adventures/miser.js';
import { port } from './adventures/port.js';
import { ranger } from './adventures/ranger.js';
import { transmogrify } from './adventures/transmogrify.js';
import { artificer } from './adventures/artificer.js';
import { bridgeTroll } from './adventures/bridge_troll.js';
import { distantLands } from './adventures/distant_lands.js';
import { giant } from './adventures/giant.js';
import { hauntedWoods } from './adventures/haunted_woods.js';
import { lostCity } from './adventures/lost_city.js';
import { relic } from './adventures/relic.js';
import { royalCarriage } from './adventures/royal_carriage.js';
import { storyteller } from './adventures/storyteller.js';
import { swampHag } from './adventures/swamp_hag.js';
import { treasureTrove } from './adventures/treasure_trove.js';
import { wineMerchant } from './adventures/wine_merchant.js';
import { hireling } from './adventures/hireling.js';
// Adventures Traveller cards
import { treasureHunter } from './adventures/treasure_hunter.js';
import { warrior } from './adventures/warrior.js';
import { hero } from './adventures/hero.js';
import { champion } from './adventures/champion.js';
import { soldier } from './adventures/soldier.js';
import { fugitive } from './adventures/fugitive.js';
import { disciple } from './adventures/disciple.js';
import { teacher } from './adventures/teacher.js';
import {
    alms, ball, bonfire, borrow, expedition, ferry, inheritance, lostArts, mission, pathfinding, pilgrimage, plan, quest, raid, save, scoutingParty, seaway, trade, training, travellingFair
} from './adventures/events.js';



import { archive } from './empires/archive.js';
import { bustlingVillage } from './empires/bustling_village.js';
import { chariotRace } from './empires/chariot_race.js';
import { farmersMarket } from './empires/farmers_market.js';
import { groundskeeper } from './empires/groundskeeper.js';
import { legionary } from './empires/legionary.js';
import { sacrifice } from './empires/sacrifice.js';
import { settlers } from './empires/settlers.js';
import { temple } from './empires/temple.js';
import { villa } from './empires/villa.js';
import { wildHunt } from './empires/wild_hunt.js';
import { enchantress } from './empires/enchantress.js';
import { cityQuarter } from './empires/city_quarter.js';
import { engineer } from './empires/engineer.js';
import { capital } from './empires/capital.js';
import { forum } from './empires/forum.js';
import { catapult } from './empires/catapult.js';
import { rocks } from './empires/rocks.js';
import { crown } from './empires/crown.js';
import { royalBlacksmith } from './empires/royal_blacksmith.js';
import { patrician } from './empires/patrician.js';
import { emporium } from './empires/emporium.js';
import { fortune } from './empires/fortune.js';
import { overlord } from './empires/overlord.js';
import { gladiator } from './empires/gladiator.js';
import { humbleCastle, crumblingCastle, smallCastle, hauntedCastle, opulentCastle, sprawlingCastle, grandCastle, kingsCastle } from './empires/castles.js';
import { charm } from './empires/charm.js';
import { encampment } from './empires/encampment.js';
import { plunder } from './empires/plunder.js';
import {
    advance, annex, banquet, conquest, delve, dominate, donate, ritual, saltTheEarth, tax, triumph, wedding, windfall
} from './empires/events.js';
import {
    fountain, wolfDen, aqueduct, arena, banditFort, basilica, baths, battlefield, colonnade, defiledShrine, keep, labyrinth, mountainPass, museum, obelisk, orchard, palace, tomb, tower, triumphalArch, wall
} from './empires/landmarks.js';
import {
    catapult_rocks_pile, encampment_plunder_pile, gladiator_fortune_pile, patrician_emporium_pile, settlers_bustling_village_pile, castles_pile
} from './empires/piles.js';

// Nocturne expansion
import * as Nocturne from './nocturne/index.js';
import * as Renaissance from './renaissance/index.js';
import * as Menagerie from './menagerie/index.js';
import * as Allies from './allies/index.js';
import * as Promos from './promos/index.js';
import * as Plunder from './plunder/index.js';
import * as RisingSun from './rising_sun/index.js';

// Helper to extract cards from module exports
function extractCards(module: any): Record<string, any> {
    return Object.fromEntries(
        Object.values(module)
            .filter((c: any) => c && typeof c === 'object' && 'id' in c && 'name' in c && 'types' in c)
            .map((c: any) => [c.id, c])
    );
}


// ============================================================================
// Card Registry
// ============================================================================

const hovel = Shelters[0];
const necropolis = Shelters[1];
const overgrown_estate = Shelters[2];

const abandoned_mine = Ruins[0];
const ruined_library = Ruins[1];
const ruined_market = Ruins[2];
const ruined_village = Ruins[3];
const survivors = Ruins[4];
const ruins = Ruins[5];

const dame_anna = Knights[0];
const dame_josephine = Knights[1];
const dame_molly = Knights[2];
const dame_natalie = Knights[3];
const dame_sylvia = Knights[4];
const sir_bailey = Knights[5];
const sir_destry = Knights[6];
const sir_martin = Knights[7];
const sir_michael = Knights[8];
const sir_vander = Knights[9];
const knights = Knights[10];

const ALL_CARDS: Record<string, any> = {
    // Treasures
    copper,
    silver,
    gold,

    // Victory
    estate,
    duchy,
    province,
    gardens,
    curse,

    // Actions
    village,
    smithy,
    market,
    militia,
    chapel,
    cellar,
    moat,
    workshop,
    moneylender,
    witch,
    festival,
    laboratory,
    bureaucrat,
    council_room: councilRoom,
    remodel,
    throne_room: throneRoom,
    library,

    // 2nd Edition New
    mine,
    harbinger,
    merchant,
    vassal,
    poacher,
    bandit,
    sentry,
    artisan,

    // Intrigue
    pawn,
    nobles,
    steward,
    courtier,
    mill,
    shanty_town,
    mining_village,
    bridge,
    conspirator,
    courtyard,
    swindler,
    wishing_well,
    baron,
    ironworks,
    secret_passage,
    diplomat,
    lurker,
    masquerade,
    minion,
    patrol,
    remplacement,
    torturer,
    trading_post,
    upgrade,
    duke,
    farm,

    // Seaside
    merchant_ship: merchantShip,
    wharf,
    caravan,
    haven,
    island,
    lighthouse,
    smugglers,
    native_village: nativeVillage,
    fishing_village: fishingVillage,
    salvager,
    treasure_map: treasureMap,
    lookout,
    sea_witch: seaWitch,
    cutpurse,
    bazaar,
    outpost,
    tactician,
    treasury,
    warehouse,

    // Seaside 2nd Edition
    astrolabe,
    blockade,
    corsair,
    monkey,
    pirate,
    sailor,
    sea_chart: seaChart,
    tide_pools: tidePools,

    // Prosperity
    platinum,
    colony,
    bishop,
    watchtower,
    anvil,
    bank,
    city,
    clerk,
    magnate,
    workers_village: workersVillage,
    charlatan,
    collection,
    crystal_ball: crystalBall,
    expand,
    forge,
    grand_market: grandMarket,
    hoard,
    investment,
    kings_court: kingsCourt,
    mint,
    monument,
    peddler,
    quarry,
    rabble,
    tiara,
    vault,
    war_chest: warChest,

    // Dark Ages
    spoils,
    cultist,
    rats,
    altar,
    sage,
    marauder,
    pillage,
    armory,
    beggar,
    forager,
    fortress,
    junk_dealer,
    market_square,
    poor_house,
    scavenger,
    squire,
    storeroom,
    vagrant,
    wandering_minstrel,
    bandit_camp,
    counterfeit,
    death_cart,
    feodum,
    ironmonger,
    mystic,
    band_of_misfits,
    catacombs,
    count,
    graverobber,
    hermit,
    hunting_grounds,
    procession,
    rebuild,
    rogue,
    urchin,
    madman,
    mercenary,
    hovel,
    necropolis,
    overgrown_estate,
    abandoned_mine,
    ruined_library,
    ruined_market,
    ruined_village,
    survivors,
    ruins,
    dame_anna,
    dame_josephine,
    dame_molly,
    dame_natalie,
    dame_sylvia,
    sir_bailey,
    sir_destry,
    sir_martin,
    sir_michael,
    sir_vander,
    knights,

    // Hinterlands
    crossroads,
    duchess,
    nomad_camp: nomadCamp,
    develop,
    oasis,
    tunnel,
    jack_of_all_trades: jackOfAllTrades,
    spice_merchant: spiceMerchant,
    trader,
    highway,
    cartographer,
    inn,
    margrave,
    stables,
    border_village: borderVillage,
    farmland,
    haggler,
    oracle,
    scheme,
    mandarin,
    embassy,
    cache,

    // Cornucopia (Abondance)
    hamlet,
    fortune_teller: fortuneTeller,
    menagerie,
    farming_village: farmingVillage,
    horse_traders: horseTraders,
    remake,
    tournament,
    young_witch: youngWitch,
    harvest,
    horn_of_plenty: hornOfPlenty,
    hunting_party: huntingParty,
    jester,
    fairgrounds,
    bag_of_gold: BagOfGold,
    diadem: Diadem,
    followers: Followers,
    princess: Princess,
    trusty_steed: TrustySteed,

    // Guilds (Guildes)
    candlestick_maker: candlestickMaker,
    stonemason,
    doctor,
    masterpiece,
    advisor,
    plaza,
    taxman,
    herald,
    baker,
    butcher,
    journeyman,
    merchant_guild: merchantGuild,
    soothsayer,

    // Adventures (Aventures)
    coin_of_the_realm: coinOfTheRealm,
    page,
    peasant,
    ratcatcher,
    raze,
    amulet,
    caravan_guard: caravanGuard,
    dungeon,
    gear,
    guide,
    duplicate,
    magpie,
    messenger,
    miser,
    port,
    ranger,
    transmogrify,
    artificer,
    bridge_troll: bridgeTroll,
    distant_lands: distantLands,
    giant,
    haunted_woods: hauntedWoods,
    lost_city: lostCity,
    relic,
    royal_carriage: royalCarriage,
    storyteller,
    swamp_hag: swampHag,
    treasure_trove: treasureTrove,
    wine_merchant: wineMerchant,
    hireling,
    // Adventures Traveller cards
    treasure_hunter: treasureHunter,
    warrior,
    hero,
    champion,
    soldier,
    fugitive,
    disciple,
    teacher,
    // Events
    alms, ball, bonfire, borrow, expedition, ferry, inheritance, lost_arts: lostArts, mission, pathfinding, pilgrimage, plan, quest, raid, save, scouting_party: scoutingParty, seaway, trade, training, travelling_fair: travellingFair,


    // Landmarks
    fountain, wolf_den: wolfDen,
    aqueduct, arena, bandit_fort: banditFort, basilica, baths, battlefield, colonnade, defiled_shrine: defiledShrine, keep, labyrinth, mountain_pass: mountainPass, museum, obelisk, orchard, palace, tomb, tower, triumphal_arch: triumphalArch, wall,

    // Empires
    settlers,
    bustling_village: bustlingVillage,
    legionary,
    wild_hunt: wildHunt,
    enchantress,
    city_quarter: cityQuarter,
    engineer,
    capital,
    archive,
    chariot_race: chariotRace,
    farmers_market: farmersMarket,
    groundskeeper,
    sacrifice,
    temple,
    villa,
    forum,
    catapult,
    rocks,
    crown,
    royal_blacksmith: royalBlacksmith,
    patrician,
    emporium,
    fortune,
    overlord,
    gladiator,
    charm,
    encampment,
    plunder,
    advance, annex, banquet, conquest, delve, dominate, donate, ritual, salt_the_earth: saltTheEarth, tax, triumph, wedding, windfall,

    humble_castle: humbleCastle,
    crumbling_castle: crumblingCastle,
    small_castle: smallCastle,
    haunted_castle: hauntedCastle,
    opulent_castle: opulentCastle,
    sprawling_castle: sprawlingCastle,
    grand_castle: grandCastle,
    kings_castle: kingsCastle,
    // Piles
    catapult_rocks_pile, encampment_plunder_pile, gladiator_fortune_pile, patrician_emporium_pile, settlers_bustling_village_pile, castles_pile,

    // Nocturne
    ghost_town: Nocturne.ghostTown,
    night_watchman: Nocturne.nightWatchman,
    monastery: Nocturne.Monastery,
    exorcist: Nocturne.Exorcist,
    will_o_wisp: Nocturne.WillOWisp,
    imp: Nocturne.Imp,
    ghost: Nocturne.Ghost,
    skulk: Nocturne.Skulk,
    ...Object.fromEntries(Nocturne.ALL_BOONS.map(b => [b.id, b])),
    ...Object.fromEntries(Nocturne.ALL_HEXES.map(h => [h.id, h])),
    ...Object.fromEntries(Nocturne.ALL_HEIRLOOMS.map(h => [h.id, h])),
    shepherd: Nocturne.Shepherd,

    // Alchemy
    potion: Potion,
    alchemist: Alchemist,
    apothecary: Apothecary,
    apprentice: Apprentice,
    scrying_pool: ScryingPool,
    familiar: Familiar,
    golem: Golem,
    herbalist: Herbalist,
    philosophers_stone: PhilosophersStone,
    possession: Possession,
    transmute: Transmute,
    university: University,
    vineyard: Vineyard,

    // Dynamic Imports for remaining cards
    ...extractCards(Nocturne),
    ...extractCards(Renaissance),
    ...extractCards(Menagerie),
    ...extractCards(Allies),
    ...extractCards(Promos),
    ...extractCards(Plunder),
    ...extractCards(RisingSun),
};



export {
    copper, silver, gold,
    estate, duchy, province, gardens, curse,
    village, smithy, market, militia, chapel, cellar, moat, workshop, moneylender, witch,
    festival, laboratory, bureaucrat, councilRoom, remodel, throneRoom, library,
    mine, harbinger, merchant, vassal, poacher, bandit, sentry, artisan,
    pawn, nobles, steward, courtier, mill, shanty_town, mining_village,
    bridge, conspirator, courtyard, swindler, wishing_well, baron, ironworks, secret_passage, diplomat,
    lurker, masquerade, minion, patrol, remplacement, torturer, trading_post, upgrade, duke,
    merchantShip, wharf, caravan, haven, island, lighthouse, smugglers, nativeVillage, fishingVillage,
    salvager, treasureMap, lookout, seaWitch, cutpurse, bazaar, outpost, tactician, treasury, warehouse,
    astrolabe, blockade, corsair, monkey, pirate, sailor, seaChart, tidePools,
    platinum, colony, bishop, watchtower,
    anvil, bank, city, clerk, magnate, workersVillage,
    charlatan, collection, crystalBall, expand, forge, hoard,
    investment, kingsCourt, mint, peddler, quarry, rabble,
    tiara, vault, warChest,
    // Dark Ages
    spoils, cultist, rats, altar, sage, marauder, pillage,
    hovel, necropolis, overgrown_estate,
    abandoned_mine, ruined_library, ruined_market, ruined_village, survivors,
    dame_anna, dame_josephine, dame_molly, dame_natalie, dame_sylvia,
    sir_bailey, sir_destry, sir_martin, sir_michael, sir_vander,
    ruins, knights,
    // Cornucopia Prizes
    BagOfGold as bag_of_gold, Diadem as diadem, Followers as followers, Princess as princess, TrustySteed as trusty_steed,

    // Empires
    settlers, bustlingVillage, legionary, wildHunt, temple, farmersMarket, villa, groundskeeper, sacrifice, chariotRace, archive,
    charm, encampment, plunder,
    alms, ball, bonfire, borrow, expedition, ferry, inheritance, lostArts, mission, pathfinding, pilgrimage, plan, quest, raid, save, scoutingParty, seaway, trade, training, travellingFair,
    advance, annex, banquet, conquest, delve, dominate, donate, ritual, saltTheEarth, tax, triumph, wedding, windfall,
    catapult_rocks_pile, encampment_plunder_pile, gladiator_fortune_pile, patrician_emporium_pile, settlers_bustling_village_pile, castles_pile,
    fountain, wolfDen, aqueduct, arena, banditFort, basilica, baths, battlefield, colonnade, defiledShrine, keep, labyrinth, mountainPass, museum, obelisk, orchard, palace, tomb, tower, triumphalArch, wall,

    // Alchemy (Potion is valid)
    Potion, Alchemist, Apothecary, Apprentice, ScryingPool, Familiar, Golem, Herbalist, PhilosophersStone, Possession, Transmute, University, Vineyard,
};

export class CardRegistry {
    /**
     * Get a card definition by ID
     */
    static get(cardId: string): CardDefinition | undefined {
        return ALL_CARDS[cardId];
    }

    /**
     * Get all card definitions
     */
    static getAll(): Record<string, CardDefinition> {
        return { ...ALL_CARDS };
    }

    /**
     * Get all registered card IDs
     */
    static getAllIds(): string[] {
        return Object.keys(ALL_CARDS);
    }

    /**
     * Dynamically register a card (useful for tests or custom expansions)
     */
    static register(card: CardDefinition): void {
        ALL_CARDS[card.id] = card;
    }

    /**
     * Check if a card has a specific type
     */
    static hasType(cardId: string, type: string): boolean {
        const card = ALL_CARDS[cardId];
        return card ? card.types.includes(type as any) : false;
    }

    /**
     * Get basic supply card IDs (always in every game)
     */
    static getBasicSupply(): string[] {
        return ['copper', 'silver', 'gold', 'estate', 'duchy', 'province', 'curse'];
    }

    /**
     * Get full base kingdom (all kingdom cards for a complete game)
     * Matches Dominion 2nd Edition
     */
    static getFullBaseKingdom(): string[] {
        return [
            'village', 'smithy', 'market', 'militia', 'chapel',
            'cellar', 'moat', 'workshop', 'witch',
            'moneylender', 'festival', 'laboratory', 'bureaucrat',
            'council_room', 'remodel', 'throne_room', 'library',
            'gardens', 'mine', 'harbinger', 'merchant', 'vassal',
            'poacher', 'bandit', 'sentry', 'artisan'
        ];
    }

    /**
     * Get recommended kingdom card IDs (10 for a standard game)
     */
    static getBaseKingdom(): string[] {
        return [
            'village', 'smithy', 'market', 'militia', 'chapel',
            'cellar', 'moat', 'workshop', 'witch', 'remodel'
        ];
    }

    /**
     * Get IDs of all cards that can be kingdom cards (Action or Victory, but not basic supply, landscapes or auxiliary cards)
     */
    static getKingdomCandidates(): string[] {
        const basic = new Set([...this.getBasicSupply(), 'potion']);

        // Use a Map to deduplicate by Card ID (since ALL_CARDS has aliases)
        const uniqueCards = new Map<string, CardDefinition>();
        Object.values(ALL_CARDS).forEach(card => {
            if (card && card.id) {
                uniqueCards.set(card.id, card);
            }
        });

        const candidates = Array.from(uniqueCards.values());

        // Types that should NEVER be in the 10-card Kingdom supply
        const excludedTypes = new Set([
            'EVENT', 'LANDMARK', 'PROJECT', 'WAY', 'ALLY', 'PROPHECY', 'TRAIT', // Landscapes
            'BOON', 'HEX', 'STATE', 'ARTIFACT', 'SPIRIT', 'ZOMBIE', 'PRIZE', 'LOOT' // Auxiliary
        ]);

        return candidates
            .filter(card => {
                const id = card.id;
                if (basic.has(id)) return false;

                // Exclude non-supply and sub-cards
                if (card.isNonSupply || card.isSubCard || card.isLegacy) return false;

                // Exclude Landscape, auxiliary types and Heirlooms
                if (card.types.some(t => excludedTypes.has(t)) || card.types.includes('HEIRLOOM')) return false;

                // Must be Action or Victory to be a Kingdom pile (standard rule)
                return card.types.includes('ACTION') || card.types.includes('VICTORY') || card.types.includes('TREASURE');
            })
            .map(c => c.id);
    }

    static getProjectCards(): CardDefinition[] {
        return Object.values(ALL_CARDS).filter(c => c.types.includes('PROJECT'));
    }

    static getArtifactCards(): CardDefinition[] {
        return Object.values(ALL_CARDS).filter(c => c.types.includes('ARTIFACT'));
    }

    /**
     * Get primary type for styling
     */
    static getPrimaryType(cardId: string): string {
        const card = this.get(cardId);
        if (!card) return 'unknown';
        const types = card.types;
        if (types.includes('CURSE')) return 'curse';
        if (types.includes('ATTACK')) return 'attack';
        if (types.includes('VICTORY')) return 'victory';
        if (types.includes('TREASURE')) return 'treasure';
        if (types.includes('ACTION')) return 'action';
        if (types.includes('REACTION')) return 'reaction';
        return 'unknown';
    }

    /**
     * Get related card IDs for preview (Heirlooms, Upgrades, Spirits, etc.)
     */
    static getRelatedCardIds(cardId: string): string[] {
        const card = this.get(cardId);
        if (!card) return [];

        const related = new Set<string>();

        // Heirlooms
        if (card.heirloom) related.add(card.heirloom);

        // Upgrades (Travellers)
        if (card.upgradesTo) related.add(card.upgradesTo);

        // Linked (Engine-level link)
        if (card.linkedCard) related.add(card.linkedCard);

        // Manual links
        if (card.relatedCardIds) {
            card.relatedCardIds.forEach(id => related.add(id));
        }

        // Hardcoded Logic for complex Nocturne cards if not set manually
        if (cardId === 'exorcist') {
            ['will_o_wisp', 'imp', 'ghost'].forEach(id => related.add(id));
        }
        if (cardId === 'necromancer') {
            ['zombie_apprentice', 'zombie_mason', 'zombie_spy'].forEach(id => related.add(id));
        }

        return Array.from(related).filter(id => id !== cardId);
    }
}


