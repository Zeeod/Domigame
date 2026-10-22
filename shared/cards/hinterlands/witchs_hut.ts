import { CardDefinition } from '../../types/CardDefinition.js';

export const witchs_hut: CardDefinition = {
    id: 'witchs_hut',
    name: 'Hutte de la sorcière',
    cost: 5,
    types: ['ACTION', 'ATTACK'],
    description: '+4 Cartes. Défaussez 2 cartes, en les dévoilant. Si ce sont deux cartes Action, chaque autre joueur reçoit une Malédiction.',
    effects: [
        { type: 'DRAW', amount: 4 },
        { type: 'DISCARD', min: 2, max: 2, message: 'Hutte de la sorcière : défaussez 2 cartes', onSuccess: [{ type: 'WITCHS_HUT_CHECK' }] }
    ] as any,
    expansion: 'hinterlands',
    isLegacy: false
};
