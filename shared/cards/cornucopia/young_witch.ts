import { CardDefinition } from '../../types/CardDefinition.js';

export const youngWitch: CardDefinition = {
    id: 'young_witch',
    name: 'Jeune sorcière',
    types: ['ACTION', 'ATTACK'],
    cost: 4,
    expansion: 'cornucopia',
    description: '+2 Cartes. Défaussez 2 cartes. Chaque autre joueur peut dévoiler un Fléau de sa main ; s\'il ne le fait pas, il reçoit une Malédiction. Mise en place : ajoutez à la réserve une pile du Royaume supplémentaire coûtant 2 ou 3 💰 (le Fléau).',
    effects: [
        { type: 'DRAW', amount: 2 },
        { type: 'DISCARD', min: 2, max: 2, message: 'Jeune sorcière : défaussez 2 cartes' },
        { type: 'ATTACK', attackEffects: [{ type: 'YOUNG_WITCH_ATTACK' }] }
    ] as any,
    // Note: Bane card setup needs special game setup handling
};
