import { CardDefinition } from '../../types/CardDefinition.js';

export const jester: CardDefinition = {
    id: 'jester',
    name: 'Bouffon',
    types: ['ACTION', 'ATTACK'],
    cost: 5,
    expansion: 'cornucopia',
    description: '+2 💰. Chaque autre joueur défausse la carte du dessus de sa pioche. Si c\'est une carte Victoire, il reçoit une Malédiction ; sinon, il reçoit une copie de cette carte ou vous en recevez une, à votre choix.',
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'ATTACK', attackEffects: [{ type: 'JESTER' }] }
    ] as any
};
