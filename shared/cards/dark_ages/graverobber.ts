import { CardDefinition } from '../../types/CardDefinition.js';

export const graverobber: CardDefinition = {
    id: 'graverobber',
    name: 'Profanatrice',
    cost: 5,
    types: ['ACTION'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: 'Choisissez: Gagnez une carte du Rebut coûtant 3💰-6💰 sur votre deck; ou écartez une carte Action de votre main et gagnez une carte coûtant jusqu\'à 3💰 de plus.',
    effects: [
        {
            type: 'CHOOSE_OPTION',
            message: 'Choisissez:',
            options: [
                { label: 'Gagner du Rebut (3-6💰)', effects: [{ type: 'GAIN_FROM_TRASH', minCost: 3, maxCost: 6, destination: 'deck' }] },
                { label: 'Écarter Action => Gagner +3💰', effects: [{ type: 'TRASH_ACTION_GAIN_UP_TO_3_MORE' }] }
            ]
        } as any
    ]
};
