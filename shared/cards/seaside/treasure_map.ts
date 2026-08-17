import { CardDefinition } from '../../types/CardDefinition.js';

export const treasureMap: CardDefinition = {
    id: 'treasure_map',
    name: 'Carte au trésor',
    cost: 4,
    types: ['ACTION'],
    effects: [
        {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'hand',
            min: 1,
            max: 1,
            filter: { cardIds: ['treasure_map'] },
            message: 'Choisissez une autre Carte au Trésor à écarter',
            destination: 'trash',
            onNoMatch: [{ type: 'TRASH_SELF' }],
            context: {
                specialAction: 'TREASURE_MAP_TRASH',
                onSuccess: [
                    { type: 'TRASH_SELF' },
                    { type: 'GAIN_CARD', cardId: 'gold', destination: 'deck' },
                    { type: 'GAIN_CARD', cardId: 'gold', destination: 'deck' },
                    { type: 'GAIN_CARD', cardId: 'gold', destination: 'deck' },
                    { type: 'GAIN_CARD', cardId: 'gold', destination: 'deck' }
                ]
            }
        }
    ],
    description: 'Écartez cette carte et une autre Carte au Trésor de votre main. Si vous le faites, gagnez 4 cartes Or que vous placez sur votre deck.',
    image: '/card-images/treasure-map.jpg',
    expansion: 'Seaside'
};
