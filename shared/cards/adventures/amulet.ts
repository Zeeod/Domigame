import { CardDefinition } from '../../types/CardDefinition.js';

export const amulet: CardDefinition = {
    id: 'amulet',
    name: 'Amulette',
    types: ['ACTION', 'DURATION'],
    cost: 3,
    expansion: 'adventures',
    set: 'adventures',
    description: 'Maintenant et au début de votre prochain tour: Choisissez: +1 💰; ou écartez une carte de votre main; ou gagnez un Argent.',
    effects: [
        {
            type: 'CHOOSE_OPTION',
            message: 'Choisissez un effet:',
            options: [
                { label: '+1 💰', effects: [{ type: 'ADD_MONEY', amount: 1 }] },
                { label: 'Écarter une carte', effects: [{ type: 'TRASH', min: 1, max: 1, from: 'hand' }] },
                { label: 'Gagner un Argent', effects: [{ type: 'GAIN_CARD', cardId: 'silver', destination: 'discardPile' }] }
            ]
        }
    ] as any,
    durationEffects: [
        {
            type: 'CHOOSE_OPTION',
            message: 'Choisissez un effet:',
            options: [
                { label: '+1 💰', effects: [{ type: 'ADD_MONEY', amount: 1 }] },
                { label: 'Écarter une carte', effects: [{ type: 'TRASH', min: 1, max: 1, from: 'hand' }] },
                { label: 'Gagner un Argent', effects: [{ type: 'GAIN_CARD', cardId: 'silver', destination: 'discardPile' }] }
            ]
        }
    ] as any
};
