import { CardDefinition } from '../../types/CardDefinition.js';

export const souk: CardDefinition = {
    id: 'souk',
    name: 'Souk',
    cost: 5,
    types: ['ACTION'],
    description: '+1 Achat, +7 💰. -1 💰 par carte dans votre main (vous ne pouvez pas descendre sous 0 💰). Quand vous recevez cette carte, écartez jusqu\'à 2 cartes de votre main.',
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'SOUK' }
    ] as any,
    onGain: [{ type: 'TRASH', min: 0, max: 2, from: 'hand', message: 'Souk : écartez jusqu\'à 2 cartes de votre main' }] as any,
    expansion: 'hinterlands',
    isLegacy: false
};
