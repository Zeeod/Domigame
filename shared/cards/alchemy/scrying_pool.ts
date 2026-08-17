import { CardDefinition } from '../../types/CardDefinition.js';

export const ScryingPool: CardDefinition = {
    id: 'scrying_pool',
    name: 'Bassin de Divination',
    types: ['ACTION', 'ATTACK'],
    cost: 2,
    potionCost: 1,
    expansion: 'alchemy',
    set: 'Alchemy',
    description: "+1 Action.\nChaque joueur (vous inclus) révèle la carte du haut de son deck et vous choisissez de la défausser ou de la replacer.\nEnsuite, révélez des cartes de votre deck jusqu'à révéler une carte qui n'est pas une Action. Mettez toutes les cartes révélées dans votre main.",
    effects: [
        {
            type: 'ADD_ACTIONS',
            amount: 1
        },
        // Attack part: Reveal top, you choose discard/replace
        {
            type: 'ATTACK',
            attackEffects: [
                {
                    type: 'REVEAL_TOP_DECK',
                    amount: 1,
                    next: [
                        {
                            // Active player chooses for the target player
                            type: 'CHOICE',
                            options: [
                                { label: 'Défausser', value: 'discard', effects: [{ type: 'DISCARD_TOP_DECK' }] },
                                { label: 'Replacer', value: 'replace', effects: [] } // Do nothing
                            ],
                            // Important: choice is made by the ATTACKER (current player) for the VICTIM.
                            // Standard CHOICE effect is usually for the affected player.
                            // We might need a "CHOOSE_FOR_OPPONENT" or similar.
                            // But typical Spy/Scrying Pool logic: Attacker sees card, Attacker chooses.
                            // EffectEngine `CHOICE` typically asks `playerId`.
                            // If this runs inside `ATTACK`, `playerId` is the victim.
                            // So we need to flag this choice as made by `activePlayerId`.
                            playerSource: 'active'
                        } as any
                    ]
                }
            ]
        },
        // Self part of attack (Scrying Pool affects YOU too)
        {
            type: 'REVEAL_TOP_DECK',
            amount: 1,
            next: [
                {
                    type: 'CHOICE',
                    options: [
                        { label: 'Défausser', value: 'discard', effects: [{ type: 'DISCARD_TOP_DECK' }] },
                        { label: 'Replacer', value: 'replace', effects: [] }
                    ],
                    playerSource: 'active'
                } as any
            ]
        },
        // Reveal until non-action
        {
            type: 'REVEAL_UNTIL',
            condition: {
                // Stop when NOT Action.
                // This implies we continue AS LONG AS Action?
                // REVEAL_UNTIL usually specifies the "Stop" condition.
                // So "Stop if card NOT has type ACTION".
                // Since filter usually matches positive, we might need a `not: true` or specific Condition type.
                // Assuming custom logic needed or expanding REVEAL_UNTIL.
                // Or: Reveal until condition is met.
                // Condition: "Not Action".
                // Implementation detail: we'll add `REVEAL_UNTIL` support for `notType: 'ACTION'`.
                notCardTypes: ['ACTION']
            } as any,
            destination: 'hand'
        }
    ]
};
