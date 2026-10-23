import { CardDefinition } from '../../types/CardDefinition.js';

export const mercenary: CardDefinition = {
    id: 'mercenary',
    name: 'Mercenaire',
    cost: 0,
    types: ['ACTION', 'ATTACK'],
    expansion: 'dark_ages',
    isSubCard: true,
    description: 'Vous pouvez écarter 2 cartes de votre main. Si vous le faites, +2 Cartes, +2 💰, et chaque autre joueur défausse jusqu\'à avoir 3 cartes en main. (Hors réserve.)',
    effects: [
        {
            type: 'TRASH', min: 0, max: 2, from: 'hand', message: 'Mercenaire : vous pouvez écarter 2 cartes',
            ifTrashed: { count: 2, effects: [
                { type: 'DRAW', amount: 2 },
                { type: 'ADD_MONEY', amount: 2 },
                { type: 'ATTACK', attackEffects: [{ type: 'DISCARD_TO_HAND_SIZE', targetSize: 3 }] }
            ] }
        }
    ] as any
};
