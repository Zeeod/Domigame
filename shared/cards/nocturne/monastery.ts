import { CardDefinition } from '../../types/CardDefinition.js';

export const Monastery: CardDefinition = {
    id: 'monastery',
    name: 'Monastère',
    cost: 2,
    types: ['ACTION', 'NIGHT'],
    heirloom: 'goat',
    expansion: 'nocturne',
    set: 'Nocturne',
    description: 'Pour chaque carte que vous avez reçue ce tour-ci, vous pouvez écarter une carte de votre main ou un Cuivre que vous avez en jeu.',
    effects: [
        {
            type: 'MONASTERY_EFFECT'
        }
    ]
};
