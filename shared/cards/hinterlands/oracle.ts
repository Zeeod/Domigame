import { CardDefinition } from '../../types/CardDefinition.js';

export const oracle: CardDefinition = {
    id: 'oracle',
    name: 'Oracle',
    types: ['ACTION', 'ATTACK'],
    cost: 3,
    expansion: 'hinterlands',
    set: 'hinterlands',
    description: '+2 Cartes. Chaque joueur (vous inclus) révèle les 2 premières cartes de sa pioche. Vous choisissez si elles sont défaussées ou replacées sur la pioche.',
    effects: [
        { type: 'DRAW', amount: 2 },
        { type: 'REVEAL_CARDS', amount: 2, source: 'deck', destination: 'deck' }
    ] as any
};
