import { CardDefinition } from '../../types/CardDefinition.js';

export const develop: CardDefinition = {
    id: 'develop',
    name: 'Développement',
    types: ['ACTION'],
    cost: 3,
    expansion: 'hinterlands',
    set: 'hinterlands',
    description: 'Écartez une carte de votre main. Gagnez deux cartes différentes de la Réserve: une coûtant exactement 1💰 de plus que la carte écartée, et une coûtant exactement 1💰 de moins. Placez-les sur votre pioche dans l\'ordre de votre choix.',
    effects: [
        {
            type: 'TRASH',
            min: 1,
            max: 1,
            from: 'hand',
            message: 'Choisissez une carte à écarter',
            onSuccess: [
                { type: 'GAIN_CARD_EXACT_COST', costBonus: 1, destination: 'deck' },
                { type: 'GAIN_CARD_EXACT_COST', costBonus: -1, destination: 'deck' }
            ]
        } as any
    ]
};
