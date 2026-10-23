import { CardDefinition } from '../../types/CardDefinition.js';

export const messenger: CardDefinition = {
    id: 'messenger',
    name: 'Messager',
    types: ['ACTION'],
    cost: 4,
    expansion: 'adventures',
    description: '+1 Achat, +2 💰. Vous pouvez placer votre pioche dans votre défausse. Quand vous recevez cette carte, si c\'est la première carte reçue pendant votre phase Achat, recevez une carte coûtant jusqu\'à 4 💰, et chaque autre joueur en reçoit une copie.',
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'MAY_DISCARD_DECK' }
    ] as any,
    onGain: [{ type: 'MESSENGER_ON_GAIN' }] as any
};
