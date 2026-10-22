import { CardDefinition } from '../../types/CardDefinition.js';

export const ScryingPool: CardDefinition = {
    id: 'scrying_pool',
    name: 'Bassin divinatoire',
    types: ['ACTION', 'ATTACK'],
    cost: 2,
    potionCost: 1,
    expansion: 'alchemy',
    description: '+1 Action. Chaque joueur (vous compris) dévoile la carte du dessus de sa pioche et soit la défausse, soit la remet, à votre choix. Puis dévoilez des cartes de votre pioche jusqu\'à dévoiler une carte qui n\'est pas une Action. Prenez en main toutes ces cartes.',
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'SCRYING_POOL' }
    ] as any
};
