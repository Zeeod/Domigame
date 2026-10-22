import { CardDefinition } from '../../types/CardDefinition.js';

export const courtier: CardDefinition = {
    id: 'courtier',
    name: 'Courtisan',
    cost: 5,
    types: ['ACTION'],
    effects: [
        { type: 'COURTIER' }
    ] as any,
    description: 'Révélez une carte de votre main. Pour chaque type de cette carte (Action, Trésor, Victoire, ...), choisissez un avantage différent : +1 Action ; +1 Achat ; +3 ?? ; ou gagnez un Or.',
    image: '/card-images/courtier.jpg',
    expansion: 'intrigue'
};
