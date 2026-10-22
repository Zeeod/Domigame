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
    expansion: 'prosperity',
    description: 'Vous pouvez dévoiler un Trésor de votre main. Recevez-en une copie. Quand vous recevez cette carte, écartez tous les Trésors hors Durée que vous avez en jeu.',
    effects: [
        {
            type: 'CHOOSE_FROM_ZONE', sourceZone: 'hand', min: 0, max: 1,
            message: 'Monnaie : dévoilez un Trésor pour en recevoir une copie',
            filter: { cardTypes: ['TREASURE'] },
            onSuccess: [{ type: 'GAIN_COPY_OF_TARGET' }]
        }
    ] as any,
    onGain: [{ type: 'MINT_ON_GAIN' }] as any
};
