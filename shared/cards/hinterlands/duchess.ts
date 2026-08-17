import { CardDefinition } from '../../types/CardDefinition.js';

export const duchess: CardDefinition = {
    id: 'duchess',
    name: 'Duchesse',
    types: ['ACTION'],
    cost: 2,
    expansion: 'hinterlands',
    set: 'hinterlands',
    description: '+2 💰. Chaque joueur (vous inclus) regarde la carte du dessus de sa pioche et peut la défausser.',
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        {
            type: 'EACH_PLAYER',
            includesSelf: true,
            effects: [
                {
                    type: 'PEEK_TOP_DECK',
                    amount: 1,
                    message: 'Options pour la carte du dessus :',
                    options: [
                        { label: 'Défausser', value: { type: 'DISCARD' } as any, effects: [{ type: 'DISCARD_TOP_DECK' }] },
                        { label: 'Replacer', value: { type: 'KEEP' } as any }
                    ]
                }
            ]
        }
    ]
    // Note: "When gaining Duchy, may gain Duchess" requires special trigger handling
};
