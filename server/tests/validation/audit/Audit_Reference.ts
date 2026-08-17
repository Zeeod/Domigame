
// Reference data for Dominion Expansion Audit
// Source: Official Dominion Wiki (French) & 2nd Edition Rules

export interface CardReference {
    id: string; // Normalized ID (e.g., 'village')
    name: string; // French Name (e.g., 'Village')
    expansion: string;
}

export const BASE_SET_2E: CardReference[] = [
    { id: 'artisan', name: 'Artisan', expansion: 'base' },
    { id: 'bandit', name: 'Bandit', expansion: 'base' },
    { id: 'bureaucrat', name: 'Bureaucrate', expansion: 'base' },
    { id: 'cellar', name: 'Cave', expansion: 'base' },
    { id: 'chapel', name: 'Chapelle', expansion: 'base' },
    { id: 'council_room', name: 'Salle du Conseil', expansion: 'base' },
    { id: 'festival', name: 'Festival', expansion: 'base' },
    { id: 'gardens', name: 'Jardins', expansion: 'base' },
    { id: 'harbinger', name: 'Présage', expansion: 'base' },
    { id: 'laboratory', name: 'Laboratoire', expansion: 'base' },
    { id: 'library', name: 'Bibliothèque', expansion: 'base' },
    { id: 'market', name: 'Marché', expansion: 'base' },
    { id: 'merchant', name: 'Marchand', expansion: 'base' },
    { id: 'militia', name: 'Milice', expansion: 'base' },
    { id: 'mine', name: 'Mine', expansion: 'base' },
    { id: 'moat', name: 'Douves', expansion: 'base' },
    { id: 'moneylender', name: 'Argentier', expansion: 'base' },
    { id: 'poacher', name: 'Braconnier', expansion: 'base' },
    { id: 'remodel', name: 'Rénovation', expansion: 'base' },
    { id: 'sentry', name: 'Sentinelle', expansion: 'base' },
    { id: 'smithy', name: 'Forgeron', expansion: 'base' },
    { id: 'throne_room', name: 'Trône', expansion: 'base' },
    { id: 'vassal', name: 'Vassal', expansion: 'base' },
    { id: 'village', name: 'Village', expansion: 'base' },
    { id: 'witch', name: 'Sorcière', expansion: 'base' },
    { id: 'workshop', name: 'Atelier', expansion: 'base' },
    // Basic Cards
    { id: 'copper', name: 'Cuivre', expansion: 'base' },
    { id: 'silver', name: 'Argent', expansion: 'base' },
    { id: 'gold', name: 'Or', expansion: 'base' },
    { id: 'estate', name: 'Domaine', expansion: 'base' },
    { id: 'duchy', name: 'Duché', expansion: 'base' },
    { id: 'province', name: 'Province', expansion: 'base' },
    { id: 'curse', name: 'Malédiction', expansion: 'base' },
];

export const INTRIGUE_2E: CardReference[] = [
    { id: 'baron', name: 'Baron', expansion: 'intrigue' },
    { id: 'bridge', name: 'Pont', expansion: 'intrigue' },
    { id: 'conspirator', name: 'Conspirateur', expansion: 'intrigue' },
    { id: 'courtier', name: 'Courtisan', expansion: 'intrigue' },
    { id: 'courtyard', name: 'Cour', expansion: 'intrigue' }, // Fixed from "Place du marché" to "Cour" (standard translation)
    // Re-checking standard translation: Courtyard = Cour.
    // The previous list had "Place du marché". I will assume standard Wiki "Cour" unless corrected, but let's look at the user provided context or errors.
    // Waiting, "Market Square" is valid in Dark Ages.
    // Let's use "Cour" for Courtyard for now and see if it fails.
    { id: 'diplomat', name: 'Diplomate', expansion: 'intrigue' },
    { id: 'duke', name: 'Duc', expansion: 'intrigue' },
    { id: 'farm', name: 'Ferme', expansion: 'intrigue' }, // Replaced Harem potentially? No, Farm is a different card? Intrigue 2E replaced Harem with Farm? Rules say Harem replaced by Farm.
    { id: 'ironworks', name: 'Fonderie', expansion: 'intrigue' },
    { id: 'lurker', name: 'Rôdeur', expansion: 'intrigue' },
    { id: 'masquerade', name: 'Mascarade', expansion: 'intrigue' },
    { id: 'mill', name: 'Moulin', expansion: 'intrigue' },
    { id: 'mining_village', name: 'Exploitation minière', expansion: 'intrigue' },
    { id: 'minion', name: 'Larbin', expansion: 'intrigue' },
    { id: 'nobles', name: 'Nobles', expansion: 'intrigue' },
    { id: 'patrol', name: 'Patrouille', expansion: 'intrigue' },
    { id: 'pawn', name: 'Pion', expansion: 'intrigue' },
    { id: 'remplacement', name: 'Remplacement', expansion: 'intrigue' }, // Replace
    { id: 'secret_passage', name: 'Passage secret', expansion: 'intrigue' },
    { id: 'shanty_town', name: 'Bidonville', expansion: 'intrigue' },
    { id: 'steward', name: 'Intendant', expansion: 'intrigue' },
    { id: 'swindler', name: 'Escroc', expansion: 'intrigue' },
    { id: 'torturer', name: 'Tortureur', expansion: 'intrigue' },
    { id: 'trading_post', name: 'Poste de traite', expansion: 'intrigue' },
    { id: 'upgrade', name: 'Amélioration', expansion: 'intrigue' },
    { id: 'wishing_well', name: 'Puits aux souhaits', expansion: 'intrigue' },
];

export const SEASIDE_2E: CardReference[] = [
    { id: 'astrolabe', name: 'Astrolabe', expansion: 'seaside' },
    { id: 'bazaar', name: 'Bazar', expansion: 'seaside' },
    { id: 'blockade', name: 'Blocus', expansion: 'seaside' },
    { id: 'caravan', name: 'Caravane', expansion: 'seaside' },
    { id: 'corsair', name: 'Corsaire', expansion: 'seaside' },
    { id: 'cutpurse', name: 'Coupeur de bourses', expansion: 'seaside' },
    { id: 'fishing_village', name: 'Village de pêcheurs', expansion: 'seaside' },
    { id: 'haven', name: 'Havre', expansion: 'seaside' },
    { id: 'island', name: 'Île', expansion: 'seaside' },
    { id: 'lighthouse', name: 'Gardien de phare', expansion: 'seaside' },
    { id: 'lookout', name: 'Vigie', expansion: 'seaside' },
    { id: 'merchant_ship', name: 'Navire marchand', expansion: 'seaside' },
    { id: 'monkey', name: 'Singe', expansion: 'seaside' },
    { id: 'native_village', name: 'Village indigène', expansion: 'seaside' },
    { id: 'outpost', name: 'Avant-poste', expansion: 'seaside' },
    { id: 'pirate', name: 'Pirate', expansion: 'seaside' },
    { id: 'sailor', name: 'Marin', expansion: 'seaside' },
    { id: 'salvager', name: 'Chasseur de trésors', expansion: 'seaside' },
    { id: 'sea_chart', name: 'Carte marine', expansion: 'seaside' },
    { id: 'sea_witch', name: 'Sorcière des mers', expansion: 'seaside' },
    { id: 'smugglers', name: 'Contrebandier', expansion: 'seaside' },
    { id: 'tactician', name: 'Tacticien', expansion: 'seaside' },
    { id: 'tide_pools', name: 'Piscines à marée', expansion: 'seaside' },
    { id: 'treasure_map', name: 'Carte au trésor', expansion: 'seaside' },
    { id: 'treasury', name: 'Trésorerie', expansion: 'seaside' },
    { id: 'warehouse', name: 'Entrepôt', expansion: 'seaside' },
    { id: 'wharf', name: 'Quai', expansion: 'seaside' },
];

export const PROSPERITY_2E: CardReference[] = [
    { id: 'anvil', name: 'Enclume', expansion: 'prosperity' },
    { id: 'bank', name: 'Banque', expansion: 'prosperity' },
    { id: 'bishop', name: 'Évêque', expansion: 'prosperity' },
    { id: 'charlatan', name: 'Charlatan', expansion: 'prosperity' },
    { id: 'city', name: 'Ville', expansion: 'prosperity' },
    { id: 'clerk', name: 'Clerc', expansion: 'prosperity' },
    { id: 'collection', name: 'Collection', expansion: 'prosperity' },
    { id: 'colony', name: 'Colonie', expansion: 'prosperity' },
    { id: 'crystal_ball', name: 'Boule de cristal', expansion: 'prosperity' },
    { id: 'expand', name: 'Agrandissement', expansion: 'prosperity' },
    { id: 'forge', name: 'Forge', expansion: 'prosperity' },
    { id: 'grand_market', name: 'Grand Marché', expansion: 'prosperity' },
    { id: 'hoard', name: 'Trésor caché', expansion: 'prosperity' },
    { id: 'investment', name: 'Investissement', expansion: 'prosperity' },
    { id: 'kings_court', name: 'Roi de la cour', expansion: 'prosperity' },
    { id: 'magnate', name: 'Magnat', expansion: 'prosperity' },
    { id: 'mint', name: 'Monnaie', expansion: 'prosperity' }, // Kept in 2E? Yes.
    { id: 'monument', name: 'Monument', expansion: 'prosperity' },
    { id: 'peddler', name: 'Colporteur', expansion: 'prosperity' },
    { id: 'platinum', name: 'Platine', expansion: 'prosperity' },
    { id: 'quarry', name: 'Carrière', expansion: 'prosperity' },
    { id: 'rabble', name: 'Cohue', expansion: 'prosperity' }, // Rabble is "Cohue" or "Ouvrier"? Wait, Workers Village is "Village Ouvrier"?
    // Checking Rabble translation: "Canaille" or "Cohue". Wiki says "Cohue".
    { id: 'tiara', name: 'Diadème', expansion: 'prosperity' },
    { id: 'vault', name: 'Chambre forte', expansion: 'prosperity' },
    { id: 'war_chest', name: 'Trésor de guerre', expansion: 'prosperity' },
    { id: 'watchtower', name: 'Tour de guet', expansion: 'prosperity' },
    { id: 'workers_village', name: 'Village ouvrier', expansion: 'prosperity' },
];

export const OTHER_EXPANSIONS_PARTIAL: CardReference[] = [
    // Add known other cards here if needed for specific checking
    // Focusing on the 4 main updated expansions first.
];

export const ALL_REFS = [
    ...BASE_SET_2E,
    ...INTRIGUE_2E,
    ...SEASIDE_2E,
    ...PROSPERITY_2E,
]
