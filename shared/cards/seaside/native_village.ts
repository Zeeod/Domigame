import { CardDefinition } from '../../types/CardDefinition';

/**
 * Native Village (Village indigène) — Seaside
 * +2 Actions. Choose one: Put the top card of your deck face down on your Native Village mat
 * (you may look at those cards at any time); or put all the cards from your mat into your hand.
 */
export const nativeVillage: CardDefinition = {
    id: 'native_village',
    name: 'Village indigène',
    types: ['ACTION'],
    cost: 2,
    description: '+2 Actions\nChoisissez : placez la carte du dessus de votre pioche face cachée sur votre plateau Village indigène ; ou prenez en main toutes les cartes de ce plateau.',
    expansion: 'seaside',
    effects: [
        { type: 'ADD_ACTIONS', amount: 2 },
        {
            type: 'CHOOSE_OPTION',
            message: 'Village indigène : choisissez une option',
            options: [
                {
                    label: 'Placer la carte du dessus de la pioche sur le plateau',
                    effects: [{ type: 'MOVE_TO_MAT', mat: 'nativeVillage', targets: 'TOP_OF_DECK' } as any]
                },
                {
                    label: 'Prendre en main les cartes du plateau',
                    effects: [{ type: 'TAKE_FROM_MAT', mat: 'nativeVillage' }]
                }
            ]
        }
    ]
};
