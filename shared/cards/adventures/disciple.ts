import { CardDefinition } from '../../types/CardDefinition.js';

export const disciple: CardDefinition = {
    id: 'disciple',
    name: 'Disciple',
    types: ['ACTION', 'TRAVELLER'],
    cost: 5,
    expansion: 'adventures',
    set: 'adventures',
    isNonSupply: true,
    description: 'Vous pouvez jouer une carte Action de votre main deux fois. Gagnez une copie de cette carte. Quand vous défaussez du jeu, vous pouvez échanger contre un Maître.',
    effects: [
        { type: 'PLAY_ACTION_TWICE_AND_GAIN_COPY' }
    ] as any,
    upgradesTo: 'teacher'
};
