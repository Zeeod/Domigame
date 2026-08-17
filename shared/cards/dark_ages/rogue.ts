import { CardDefinition } from '../../types/CardDefinition.js';

export const rogue: CardDefinition = {
    id: 'rogue',
    name: 'Vaurienne',
    cost: 5,
    types: ['ACTION', 'ATTACK'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: '+2💰. S\'il y a une carte coûtant 3💰-6💰 dans le Rebut, gagnez-la. Sinon, chaque autre joueur révèle les 2 cartes du dessus de son deck, en écarte une coûtant 3💰-6💰 et défausse le reste.',
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'ROGUE_EFFECT' } as any
    ]
};
