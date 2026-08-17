import { CardDefinition } from '../../types/CardDefinition.js';

export const giant: CardDefinition = {
    id: 'giant',
    name: 'Géant',
    types: ['ACTION', 'ATTACK'],
    cost: 5,
    expansion: 'adventures',
    set: 'adventures',
    description: 'Retournez votre jeton de Voyage. Si face visible, +1 💰. Si face cachée, +5 💰, et chaque autre joueur révèle la carte du dessus de sa pioche et l\'écarte si elle coûte 3-6 💰, sinon la défausse et gagne une Malédiction.',
    effects: [
        {
            type: 'FLIP_JOURNEY_TOKEN',
            onFaceUp: [{ type: 'ADD_MONEY', amount: 1 }],
            onFaceDown: [
                { type: 'ADD_MONEY', amount: 5 },
                {
                    type: 'ATTACK',
                    attackEffects: [{ type: 'GIANT_ATTACK' }]
                }
            ]
        }
    ] as any
};
