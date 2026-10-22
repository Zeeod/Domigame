import { CardDefinition } from '../../types/CardDefinition.js';

export const remplacement: CardDefinition = {
    id: 'remplacement',
    name: 'Remplacement',
    cost: 5,
    types: ['ACTION', 'ATTACK'],
    effects: [
        {
            type: 'TRASH', min: 1, max: 1, from: 'hand',
            onSuccess: [
                {
                    type: 'GAIN_CARD_PLUS_COST', costBonus: 2, destination: 'discardPile',
                    onGainEffects: [
                        // Action or Treasure → onto your deck; Victory → each other player gains a Curse
                        { type: 'CONDITION', condition: 'IS_ACTION', trueEffects: [{ type: 'MOVE_GAINED_TO_HAND', destination: 'deck' }],
                          falseEffects: [{ type: 'CONDITION', condition: 'IS_TREASURE', trueEffects: [{ type: 'MOVE_GAINED_TO_HAND', destination: 'deck' }] }] },
                        { type: 'CONDITION', condition: 'IS_VICTORY', trueEffects: [{ type: 'ATTACK', attackEffects: [{ type: 'GAIN_CARD', cardId: 'curse' }] }] }
                    ]
                }
            ]
        }
    ] as any,
    description: 'Écartez une carte de votre main. Gagnez une carte coûtant jusqu’à 2 ?? de plus que la carte écartée. Si la carte gagnée est une carte Victoire, chaque autre joueur gagne une Malédiction. Si c’est une carte Action ou Trésor, mettez-la sur votre deck.',
    image: '/card-images/remplacement.jpg',
    expansion: 'intrigue'
};
