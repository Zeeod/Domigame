import { CardDefinition } from '../../types/CardDefinition.js';

export const procession: CardDefinition = {
    id: 'procession',
    name: 'Procession',
    cost: 4,
    types: ['ACTION'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: 'Vous pouvez jouer une carte Action non-Durée de votre main deux fois. Écartez-la. Gagnez une carte Action coûtant exactement 1💰 de plus.',
    effects: [
        {
            type: 'SELECT_AND_APPLY',
            source: 'hand',
            filter: { cardTypes: ['ACTION'], excludeTypes: ['DURATION'] },
            message: 'Choisissez une carte Action (non-Durée) à jouer deux fois avec Procession',
            next: [
                { type: 'PLAY_ACTION_TWICE' },
                { type: 'TRASH' },
                { type: 'GAIN_CARD_PLUS_COST', costBonus: 1, cardTypes: ['ACTION'] }
            ]
        } as any
    ]
};
