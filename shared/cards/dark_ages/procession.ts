import { CardDefinition } from '../../types/CardDefinition.js';

export const procession: CardDefinition = {
    id: 'procession',
    name: 'Procession',
    cost: 4,
    types: ['ACTION'],
    expansion: 'dark_ages',
    description: 'Vous pouvez jouer une carte Action non-Durée de votre main deux fois. Écartez-la. Gagnez une carte Action coûtant exactement 1💰 de plus.',
    effects: [{ type: 'PROCESSION' }] as any
};
