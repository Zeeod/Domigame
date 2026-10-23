import { CardDefinition } from '../../types/CardDefinition.js';

export const encampment: CardDefinition = {
    id: 'encampment',
    name: 'Campement',
    types: ['ACTION'],
    cost: 2,
    description: '+2 Cartes, +2 Actions. Vous pouvez dévoiler un Or ou un Butin de votre main. Sinon, mettez cette carte de côté et remettez-la dans la réserve au début de l\'Ajustement.',
    expansion: 'empires',
    isSubCard: true,
    effects: [{ type: 'DRAW', amount: 2 }, { type: 'ADD_ACTIONS', amount: 2 }, { type: 'ENCAMPMENT' }] as any
};
