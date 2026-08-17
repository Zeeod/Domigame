import { CardDefinition } from '../../types/CardDefinition.js';

export const hireling: CardDefinition = {
    id: 'hireling',
    name: 'Mercenaire',
    types: ['ACTION', 'DURATION'],
    cost: 6,
    expansion: 'adventures',
    set: 'adventures',
    description: 'Au début de chacun de vos tours pour le reste de la partie: +1 Carte.',
    effects: [],
    durationEffects: [
        { type: 'DRAW', amount: 1 }
    ],
    isPermanentDuration: true
};
