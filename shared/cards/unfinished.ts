/**
 * Cartes enregistrées mais PAS ENCORE CODÉES (texte présent, aucun effet).
 *
 * Elles sont exclues du tirage du royaume, du tirage des paysages et du
 * sélecteur du lobby, pour qu'une partie ne tombe jamais dessus.
 *
 * ➜ Quand tu implémentes une de ces cartes : retire son id d'ici et ajoute
 *   son test dans tests/cards/. Le test tests/cards/UnfinishedCards.test.ts
 *   échoue si une carte listée ici a reçu des effets (pour ne pas l'oublier).
 *
 * Suivi : docs/roadmap/PlanFinalisation.md (phase 2.3).
 */
/** Cards with a text but no effect at all. */
export const SHELL_CARDS: ReadonlySet<string> = new Set([
    // Empires — Landmarks + King's Castle
    'aqueduct', 'arena', 'bandit_fort', 'basilica', 'baths', 'battlefield', 'colonnade',
    'defiled_shrine', 'fountain', 'keep', 'labyrinth', 'mountain_pass', 'museum', 'obelisk',
    'orchard', 'palace', 'tomb', 'tower', 'triumphal_arch', 'wall', 'wolf_den', 'kings_castle',

    // Allies — cartes Allié
    'architects_guild', 'band_of_nomads', 'cave_dwellers', 'circle_of_witches', 'city_state',
    'coastal_haven', 'crafters_guild', 'desert_guides', 'family_of_inventors',
    'fellowship_of_scribes', 'forest_dwellers', 'gang_of_pickpockets', 'island_folk',
    'league_of_bankers', 'league_of_shopkeepers', 'market_towns', 'mountain_folk',
    'order_of_astrologers', 'order_of_masons', 'peaceful_cult', 'plateau_shepherds',
    'trappers_lodge', 'woodcarvers_guild',

    // Plunder — Événements et Traits
    'avoid', 'bury', 'deliver', 'foray', 'invasion', 'journey', 'launch', 'looting', 'maelstrom',
    'mirror', 'peril', 'prepare', 'prosper', 'rush', 'scrounge',
    'cheap', 'fated', 'inherited', 'patient', 'shy', 'tireless',

    // Renaissance — Projets + 2 cartes
    'academy', 'barracks', 'canal', 'capitalism', 'citadel', 'crop_rotation', 'exploration',
    'fair', 'fleet', 'guildhall', 'innovation', 'pageant', 'piazza', 'road_network', 'sewers',
    'silos', 'sinister_plot', 'star_chart', 'sculptor', 'scepter',

    // Rising Sun — Événements
    'amass', 'asceticism', 'continue', 'credit', 'foresight', 'gather', 'kintsugi', 'practice',
    'receive_tribute', 'sea_trade',

    // Menagerie — Événements + 1 Voie
    'banish', 'commerce', 'enhance', 'invest', 'march', 'populate', 'pursue', 'stampede',
    'transport', 'way_of_the_mouse',

    // Nocturne
    'crypt', 'devils_workshop', 'fool', 'necromancer', 'pooka', 'vampire',
]);

/**
 * Cards that have effects but do not follow their rules yet (need engine work).
 * Listed here so that a game never uses them in a broken state.
 */
export const BROKEN_CARDS: ReadonlySet<string> = new Set([
    // Alchemy — needs "control another player's turn" support
    'possession',
]);

export const UNFINISHED_CARDS: ReadonlySet<string> = new Set([...SHELL_CARDS, ...BROKEN_CARDS]);

export const isUnfinishedCard = (id: string): boolean => UNFINISHED_CARDS.has(id);
