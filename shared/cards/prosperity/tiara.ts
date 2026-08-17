import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Tiara - Prosperity 2nd Edition
 * Cost: 4
 * Types: TREASURE
 * Text: +1 Buy. You may play a Treasure from your hand twice. 
 * When you gain a card this turn, you may put it on top of your deck.
 */
export const tiara: CardDefinition = {
    id: 'tiara',
    name: 'Diadème', // Or Tiare
    cost: 4,
    types: ['TREASURE'],
    expansion: 'Prosperity',
    set: 'prosperity',
    description: '+1 Achat. Vous pouvez jouer une carte Trésor de votre main deux fois. Quand vous gagnez une carte ce tour-ci, vous pouvez la placer sur votre pioche.',
    treasureValue: 0,
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'hand',
            min: 0,
            max: 1,
            filter: { cardTypes: ['TREASURE'] },
            message: 'Choisissez un trésor à jouer deux fois (Tiare)',
            destination: 'playArea',
            effects: [
                { type: 'PLAY_TARGET', times: 2 }
            ],
            optional: true
        }
    ],
    triggers: [
        {
            trigger: 'ON_GAIN',
            filter: {},
            effects: [
                {
                    type: 'CHOOSE_OPTION',
                    options: [
                        { label: 'Placer sur la pioche', effects: [{ type: 'MOVE_TO_POSITION', position: 'TOP', from: 'discardPile' }] },
                        { label: 'Laisser dans la défausse', effects: [] }
                    ],
                    message: 'Voulez-vous placer la carte gagnée sur votre pioche ? (Diadème)'
                }
            ]
        }
    ]
};
// Note: The on-gain effect needs engine support for global triggers.
