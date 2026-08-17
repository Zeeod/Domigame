import { CardDefinition } from '../../types/CardDefinition.js';

export const Exorcist: CardDefinition = {
    id: 'exorcist',
    name: 'Exorciste',
    cost: 4,
    types: ['ACTION', 'NIGHT'],
    heirloom: 'haunted_mirror',
    expansion: 'nocturne',
    set: 'Nocturne',
    description: 'Écartez une carte de votre main. Recevez en main un Esprit moins cher que la carte écartée (dans la réserve non-supply).',
    relatedCardIds: ['will_o_wisp', 'imp', 'ghost'],
    effects: [
        {
            type: 'EXORCIST_EFFECT'
        }
    ]
};
