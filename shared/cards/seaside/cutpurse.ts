import { CardDefinition } from '../../types/CardDefinition';

export const cutpurse: CardDefinition = {
    id: 'cutpurse',
    name: 'Coupeur de bourses',
    types: ['ACTION', 'ATTACK'],
    description: '+2 Pièces. Chaque autre joueur défausse un Cuivre (ou dévoile une main sans Cuivre).',
    cost: 4,
    set: 'seaside',
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        {
            type: 'ATTACK',
            attackEffects: [
                {
                    type: 'DISCARD',
                    min: 1,
                    max: 1,
                    message: 'Défaussez un Cuivre (ou révélez une main sans Cuivre)',
                    filter: { cardIds: ['copper'] }, // Specific filter for Copper
                    onFailure: [
                        { type: 'REVEAL_HAND' } // Reveal hand if fails (no Copper)
                    ]
                }
            ]
        }
    ]
};
