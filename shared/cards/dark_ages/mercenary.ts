import { CardDefinition } from '../../types/CardDefinition.js';

export const mercenary: CardDefinition = {
    id: 'mercenary',
    name: 'Mercenaire',
    cost: 0,
    types: ['ACTION', 'ATTACK'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    isSubCard: true,
    description: 'Vous pouvez écarter 2 cartes de votre main. Si vous le faites, +2 Cartes, +2💰, et chaque autre joueur défausse jusqu\'à 3 cartes en main.',
    effects: [
        {
            type: 'MAY_TRASH_FOR_BONUS',
            min: 2,
            max: 2,
            from: 'hand',
            bonus: [
                { type: 'DRAW', amount: 2 },
                { type: 'ADD_MONEY', amount: 2 },
                {
                    type: 'OTHER_PLAYERS_EFFECT',
                    effect: { type: 'DISCARD_DOWN_TO', amount: 3 }
                }
            ]
        } as any
    ]
};
