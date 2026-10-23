import { CardDefinition } from '../../types/CardDefinition.js';

export const rogue: CardDefinition = {
    id: 'rogue',
    name: 'Vaurienne',
    cost: 5,
    types: ['ACTION', 'ATTACK'],
    expansion: 'dark_ages',
    description: '+2 💰. S\'il y a des cartes coûtant de 3 à 6 💰 dans le rebut, recevez-en une. Sinon, chaque autre joueur dévoile les 2 cartes du dessus de sa pioche, en écarte une coûtant de 3 à 6 💰 et défausse le reste.',
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'ROGUE' }
    ] as any
};
