import { CardDefinition } from '../../types/CardDefinition.js';

export const trader: CardDefinition = {
    id: 'trader',
    name: 'Commerçant',
    types: ['ACTION', 'REACTION'],
    cost: 4,
    expansion: 'hinterlands',
    set: 'hinterlands',
    description: 'Écartez une carte de votre main. Gagnez un Argent par 💰 de coût de la carte écartée. Réaction: Quand vous gagnez une carte, vous pouvez révéler cette carte pour l\'échanger contre un Argent.',
    effects: [
        {
            type: 'TRASH',
            min: 1,
            max: 1,
            from: 'hand',
            message: 'Choisissez une carte à écarter',
            onSuccess: [
                { type: 'GAIN_SILVERS_PER_COST' }
            ]
        } as any
    ],
    reactionEffects: [
        { type: 'REPLACE_GAIN_WITH_SILVER' }
    ] as any
};
