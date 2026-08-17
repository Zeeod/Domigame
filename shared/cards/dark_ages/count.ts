import { CardDefinition } from '../../types/CardDefinition.js';

export const count: CardDefinition = {
    id: 'count',
    name: 'Comte',
    cost: 5,
    types: ['ACTION'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: 'Choisissez: Défaussez 2 cartes; ou mettez une carte de votre main sur votre deck; ou gagnez un Cuivre. Puis choisissez: +3💰; ou écartez votre main; ou gagnez un Duché.',
    effects: [
        {
            type: 'CHOOSE_OPTION',
            message: 'Premier choix:',
            options: [
                { label: 'Défausser 2 cartes', effects: [{ type: 'DISCARD', min: 2, max: 2, from: 'hand' }] },
                { label: 'Remettre une carte sur le deck', effects: [{ type: 'TOPDECK_FROM_HAND', min: 1, max: 1 }] },
                { label: 'Gagner un Cuivre', effects: [{ type: 'GAIN_CARD', cardId: 'copper', destination: 'discardPile' }] }
            ]
        } as any,
        {
            type: 'CHOOSE_OPTION',
            message: 'Second choix:',
            options: [
                { label: '+3💰', effects: [{ type: 'ADD_MONEY', amount: 3 }] },
                { label: 'Écarter votre main', effects: [{ type: 'TRASH_HAND' }] },
                { label: 'Gagner un Duché', effects: [{ type: 'GAIN_CARD', cardId: 'duchy', destination: 'discardPile' }] }
            ]
        } as any
    ]
};
