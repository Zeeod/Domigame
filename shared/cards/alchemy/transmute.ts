import { CardDefinition } from '../../types/CardDefinition.js';

export const Transmute: CardDefinition = {
    id: 'transmute',
    name: 'Transmutation',
    types: ['ACTION'],
    cost: 0,
    potionCost: 1,
    expansion: 'alchemy',
    set: 'Alchemy',
    description: "Écartez une carte de votre main. Si c'est...\nUne Action, recevez un Duché.\nUn Trésor, recevez une autre Transmutation.\nUne Victoire, recevez un Or.",
    effects: [
        {
            type: 'TRASH',
            source: 'hand',
            min: 1,
            max: 1,
            message: 'Choisissez une carte à écarter',
            next: [
                {
                    type: 'SWITCH_ON_LAST_TRASHED',
                    cases: [
                        {
                            condition: { type: 'HAS_TYPE', cardType: 'ACTION' },
                            effects: [{ type: 'GAIN_CARD', cardId: 'duchy' }]
                        },
                        {
                            condition: { type: 'HAS_TYPE', cardType: 'TREASURE' },
                            effects: [{ type: 'GAIN_CARD', cardId: 'transmute' }]
                        },
                        {
                            condition: { type: 'HAS_TYPE', cardType: 'VICTORY' },
                            effects: [{ type: 'GAIN_CARD', cardId: 'gold' }]
                        }
                    ]
                }
            ]
        }
    ]
};
