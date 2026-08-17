import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Mint - Prosperity 2nd Edition
 * Cost: 5
 * Types: ACTION
 * Text: You may reveal a Treasure card from your hand. Gain a copy of it. 
 * When you buy this, trash all Treasures you have in play.
 */
export const mint: CardDefinition = {
    id: 'mint',
    name: 'Monnaie', // Or Monnaie
    cost: 5,
    types: ['ACTION'],
    expansion: 'Prosperity',
    set: 'prosperity',
    description: 'Révélez une carte Trésor de votre main. Gagnez-en une copie. Lors de l\'achat : écartez tous vos Trésors en jeu.',
    effects: [
        {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'hand',
            message: 'Révélez un Trésor pour en gagner une copie',
            filter: { cardTypes: ['TREASURE'] },
            onSuccess: [
                { type: 'GAIN_COPY_OF_TARGET' }
            ]
        }
    ],
    onBuy: [
        {
            type: 'TRASH',
            from: 'play_area',
            forceAll: true,
            filter: { cardTypes: ['TREASURE'] }
        } as any
    ]
};
