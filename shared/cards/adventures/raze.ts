import { CardDefinition } from '../../types/CardDefinition.js';

export const raze: CardDefinition = {
    id: 'raze',
    name: 'Raser',
    types: ['ACTION'],
    cost: 2,
    expansion: 'adventures',
    set: 'adventures',
    description: '+1 Action. Écartez cette carte ou une carte de votre main. Regardez autant de cartes du dessus de votre pioche que le coût de la carte écartée et prenez-en une en main.',
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        {
            type: 'TRASH',
            min: 1,
            max: 1,
            from: 'hand_or_play',
            message: 'Écartez cette carte ou une carte de votre main',
            onSuccess: [
                { type: 'LOOK_AT_TOP_COST', pickOne: true }
            ]
        }
    ] as any
};
