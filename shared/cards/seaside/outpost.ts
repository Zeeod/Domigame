import { CardDefinition } from '../../types/CardDefinition';

/**
 * Outpost (Avant-poste) — Seaside 2nd Edition
 * Action – Duration. You only draw 3 cards for your next hand.
 * Take an extra turn after this one (but not a 3rd turn in a row).
 *
 * The 3-card hand and the extra turn are handled by the engine
 * (SCHEDULE_EXTRA_TURN with turnType OUTPOST → cleanup draws 3).
 */
export const outpost: CardDefinition = {
    id: 'outpost',
    name: 'Avant-poste',
    types: ['ACTION', 'DURATION'],
    description: "Vous ne piochez que 3 cartes pour votre prochaine main. Jouez un tour supplémentaire après celui-ci (mais pas un 3e tour d'affilée).",
    cost: 5,
    expansion: 'seaside',
    effects: [
        { type: 'SCHEDULE_EXTRA_TURN', turnType: 'OUTPOST' } as any
    ]
};
