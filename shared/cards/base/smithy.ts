/**
 * Smithy - Base Action Card
 * +3 Cards
 */
import { CardDefinition } from '../../types/CardDefinition.js';

export const smithy: CardDefinition = {
    id: 'smithy',
    name: 'Forgeron',
    cost: 4,
    types: ['ACTION'],
    effects: [
        { type: 'DRAW', amount: 3 }
    ],
    description: '+3 Cartes.',
    image: '/card-images/smithy.jpg',
    expansion: 'Base'
};
