import { CardDefinition } from '../../types/CardDefinition';

export const watchtower: CardDefinition = {
    id: 'watchtower',
    name: 'Tour de guet',
    cost: 3,
    types: ['ACTION', 'REACTION'],
    effects: [
        { type: 'DRAW_UNTIL_HAND_SIZE', targetSize: 6 }
    ],
    // Reaction part needs engine support for "onGain" triggers
    description: 'Piochez jusqu\'à avoir 6 cartes en main. Réaction : Quand vous gagnez une carte, vous pouvez révéler cette carte de votre main. Si vous le faites, écartez la carte gagnée ou mettez-la sur votre deck.',
    image: '/card-images/watchtower.jpg',
    expansion: 'Prosperity'
};
