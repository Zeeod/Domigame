import { CardDefinition } from '../../types/CardDefinition.js';

export const messenger: CardDefinition = {
    id: 'messenger',
    name: 'Messager',
    types: ['ACTION'],
    cost: 4,
    expansion: 'adventures',
    set: 'adventures',
    description: '+1 Achat, +2 💰. Vous pouvez mettre votre pioche dans votre défausse. Si c\'est le premier achat de ce tour et que vous achetez cette carte, gagnez une carte coûtant jusqu\'à 4 💰, tous les joueurs gagnent une copie.',
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'ADD_MONEY', amount: 2 },
        {
            type: 'CHOOSE_OPTION',
            optional: true,
            message: 'Mettre votre pioche dans votre défausse ?',
            options: [
                { label: 'Oui', effects: [{ type: 'DECK_TO_DISCARD' }] },
                { label: 'Non', effects: [] }
            ]
        }
    ] as any
};
