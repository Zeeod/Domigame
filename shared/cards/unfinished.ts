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




]);

/**
 * Cards that have effects but do not follow their rules yet (need engine work).
 * Listed here so that a game never uses them in a broken state.
 */
export const BROKEN_CARDS: ReadonlySet<string> = new Set([
]);

export const UNFINISHED_CARDS: ReadonlySet<string> = new Set([...SHELL_CARDS, ...BROKEN_CARDS]);

export const isUnfinishedCard = (id: string): boolean => UNFINISHED_CARDS.has(id);
