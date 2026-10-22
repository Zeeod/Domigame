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
    description: 'Piochez jusqu\'à avoir 6 cartes en main. Quand vous recevez une carte, vous pouvez dévoiler cette carte de votre main pour soit écarter la carte reçue, soit la placer sur votre pioche.',
    image: '/card-images/watchtower.jpg',
    expansion: 'prosperity',
    reactionTrigger: 'GAIN' as any,
    reactionEffects: [{
        type: 'SELECT_OPTION', message: 'Tour de guet : que faire de la carte reçue ?',
        options: [
            { label: 'L\'écarter', effects: [{ type: 'GAINED_CARD_TO', to: 'trash' }] },
            { label: 'La placer sur la pioche', effects: [{ type: 'GAINED_CARD_TO', to: 'deck' }] }
        ]
    }] as any
};
