/**
 * Expansions — source unique de vérité pour les identifiants d'extension.
 *
 * Chaque CardDefinition porte `expansion` avec l'un de ces identifiants
 * (minuscules, snake_case). Toujours lire l'extension d'une carte via
 * `getCardExpansion()` plutôt que d'accéder au champ directement.
 */

export const EXPANSION_IDS = [
    'base', 'intrigue', 'seaside', 'alchemy', 'prosperity', 'cornucopia', 'guilds',
    'hinterlands', 'dark_ages', 'adventures', 'empires', 'nocturne', 'renaissance',
    'menagerie', 'allies', 'plunder', 'rising_sun', 'promos',
] as const;

export type ExpansionId = typeof EXPANSION_IDS[number];

/** Libellés français affichés dans l'interface. */
export const EXPANSION_LABELS: Record<ExpansionId, string> = {
    base: 'Base',
    intrigue: 'Intrigue',
    seaside: 'Rivages',
    alchemy: 'Alchimie',
    prosperity: 'Prospérité',
    cornucopia: 'Abondance',
    guilds: 'Guildes',
    hinterlands: 'Arrière-Pays',
    dark_ages: 'Âges Sombres',
    adventures: 'Aventures',
    empires: 'Empires',
    nocturne: 'Nocturne',
    renaissance: 'Renaissance',
    menagerie: 'Ménagerie',
    allies: 'Alliés',
    plunder: 'Pillage',
    rising_sun: 'Soleil Levant',
    promos: 'Promos',
};

const ALIASES: Record<string, ExpansionId> = {
    promo: 'promos',
    darkages: 'dark_ages',
    risingsun: 'rising_sun',
};

/**
 * Convertit n'importe quelle écriture ("Dark Ages", "dark-ages", "Promo"…)
 * vers l'identifiant canonique. Retourne undefined si inconnue.
 */
export function normalizeExpansion(raw: string | undefined | null): ExpansionId | undefined {
    if (!raw) return undefined;
    const key = raw.trim().toLowerCase().replace(/[\s-]+/g, '_');
    if ((EXPANSION_IDS as readonly string[]).includes(key)) return key as ExpansionId;
    return ALIASES[key.replace(/_/g, '')] ?? ALIASES[key];
}

/**
 * Identifiants acceptés par les filtres (lobby) : ids canoniques + groupes.
 * `cornucopia_guilds` couvre les deux moitiés de la boîte 2e édition.
 */
export function expandExpansionFilter(filter: string[]): Set<ExpansionId> {
    const out = new Set<ExpansionId>();
    for (const f of filter) {
        if (f === 'cornucopia_guilds') { out.add('cornucopia'); out.add('guilds'); continue; }
        const id = normalizeExpansion(f);
        if (id) out.add(id);
    }
    return out;
}

/** Extension d'une carte (champ `expansion`, ou `set` en secours). 'base' par défaut. */
export function getCardExpansion(card: { expansion?: string; set?: string } | undefined | null): ExpansionId {
    return normalizeExpansion(card?.expansion) ?? normalizeExpansion(card?.set) ?? 'base';
}
