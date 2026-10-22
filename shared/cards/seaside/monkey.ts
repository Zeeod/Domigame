import { CardDefinition } from '../../types/CardDefinition';

export const monkey: CardDefinition = {
    id: 'monkey',
    name: 'Singe',
    types: ['ACTION', 'DURATION'],
    cost: 3,
    description: 'Jusqu\'à votre prochain tour, lorsque le joueur à votre droite gagne une carte, +1 Carte. Au début de votre prochain tour : +1 Carte.',
    expansion: 'seaside',
    effects: [
        { type: 'MONKEY' }
    ] as any,
    durationEffects: [
        {
            type: 'DRAW',
            amount: 1
        }
    ]
};
