import { CardDefinition } from '../../types/CardDefinition';

export const bishop: CardDefinition = {
    id: 'bishop',
    name: 'Évêque',
    cost: 4,
    types: ['ACTION'],
    effects: [
        { type: 'ADD_MONEY', amount: 1 },
        { type: 'ADD_VICTORY_TOKENS', amount: 1 },
        {
            type: 'TRASH',
            min: 1,
            max: 1,
            from: 'hand',
            message: 'Choisissez une carte à écarter pour des jetons Victoire',
            onSuccess: [{
                type: 'ADD_VICTORY_TOKENS',
                amount: 'HALF_LAST_TRASHED_COST'
            }]
        },
        {
            type: 'ATTACK',
            attackEffects: [
                {
                    type: 'TRASH',
                    min: 0,
                    max: 1,
                    from: 'hand',
                    message: 'Vous pouvez écarter une carte de votre main (Évêque)'
                }
            ]
        }
    ],
    description: '+1 💰, +1 Jeton Victoire 🛡️. Écartez une carte de votre main. +1 Jeton Victoire par tranche de 2💰 de son coût (arrondi à l\'inférieur). Chaque autre joueur peut écarter une carte de sa main.',
    image: '/card-images/bishop.jpg',
    expansion: 'Prosperity'
};
