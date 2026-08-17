import { CardDefinition } from '../../types/CardDefinition.js';

export const jester: CardDefinition = {
    id: 'jester',
    name: 'Bouffon',
    types: ['ACTION', 'ATTACK'],
    cost: 5,
    expansion: 'cornucopia',
    set: 'cornucopia',
    description: '+2 💰. Chaque autre joueur défausse la carte du dessus de sa pioche. Si c\'est une Victoire, il gagne une Malédiction. Sinon, vous choisissez: vous gagnez une copie OU il gagne une copie.',
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        {
            type: 'ATTACK',
            attackEffects: [
                { type: 'JESTER_EFFECT' }
            ]
        }
    ] as any
};
