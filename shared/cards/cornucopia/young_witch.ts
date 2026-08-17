import { CardDefinition } from '../../types/CardDefinition.js';

export const youngWitch: CardDefinition = {
    id: 'young_witch',
    name: 'Jeune sorcière',
    types: ['ACTION', 'ATTACK'],
    cost: 4,
    expansion: 'cornucopia',
    set: 'cornucopia',
    description: '+2 Cartes. Défaussez 2 cartes. Chaque autre joueur gagne une Malédiction sauf s\'il révèle le Fléau de sa main. Mise en place: Ajoutez une pile de cartes de coût 2 ou 3 comme "Fléau".',
    effects: [
        { type: 'DRAW', amount: 2 },
        { type: 'DISCARD', min: 2, max: 2, message: 'Défaussez 2 cartes.' },
        {
            type: 'ATTACK',
            attackEffects: [
                { type: 'GAIN_CURSE_UNLESS_BANE' }
            ]
        }
    ] as any
    // Note: Bane card setup needs special game setup handling
};
