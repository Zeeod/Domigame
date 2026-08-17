import { CardDefinition } from '../../types/CardDefinition.js';

export const journeyman: CardDefinition = {
    id: 'journeyman',
    name: 'Compagnon',
    types: ['ACTION'],
    cost: 5,
    expansion: 'guilds',
    set: 'guilds',
    description: 'Nommez une carte. Révélez des cartes du dessus de votre pioche jusqu\'à en révéler 3 qui ne sont pas la carte nommée. Mettez-les en main. Défaussez le reste.',
    effects: [
        { type: 'NAME_A_CARD' },
        { type: 'REVEAL_UNTIL_COUNT', count: 3, excludeNamed: true, destination: 'hand' }
    ] as any
};
