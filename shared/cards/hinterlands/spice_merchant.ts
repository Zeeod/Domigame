import { CardDefinition } from '../../types/CardDefinition.js';

export const spiceMerchant: CardDefinition = {
    id: 'spice_merchant',
    name: 'Marchand d\'épices',
    types: ['ACTION'],
    cost: 4,
    expansion: 'hinterlands',
    set: 'hinterlands',
    description: 'Vous pouvez écarter un Trésor de votre main. Si vous le faites, choisissez: +2 Cartes et +1 Action; ou +2 💰 et +1 Achat.',
    effects: [
        {
            type: 'TRASH',
            from: 'hand',
            filter: { cardTypes: ['TREASURE'] },
            min: 0,
            max: 1,
            isOptional: true,
            message: 'Écartez un Trésor',
            onSuccess: [
                {
                    type: 'CHOOSE_OPTION',
                    message: 'Choisissez votre bonus:',
                    options: [
                        { label: '+2 Cartes, +1 Action', effects: [{ type: 'DRAW', amount: 2 }, { type: 'ADD_ACTIONS', amount: 1 }] },
                        { label: '+2 💰, +1 Achat', effects: [{ type: 'ADD_MONEY', amount: 2 }, { type: 'ADD_BUYS', amount: 1 }] }
                    ]
                }
            ]
        } as any
    ]
};
