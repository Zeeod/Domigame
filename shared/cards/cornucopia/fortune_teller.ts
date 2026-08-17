import { CardDefinition } from '../../types/CardDefinition.js';

export const fortuneTeller: CardDefinition = {
    id: 'fortune_teller',
    name: 'Diseuse de bonne aventure',
    types: ['ACTION', 'ATTACK'],
    cost: 3,
    expansion: 'cornucopia',
    set: 'cornucopia',
    description: '+2 💰. Chaque autre joueur révèle des cartes du dessus de sa pioche jusqu\'à révéler une carte Victoire ou Malédiction, et la met sur sa pioche. Le reste est défaussé.',
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        {
            type: 'ATTACK',
            attackEffects: [
                { type: 'REVEAL_UNTIL', types: ['VICTORY', 'CURSE'], destination: 'deck' }
            ]
        }
    ] as any
};
