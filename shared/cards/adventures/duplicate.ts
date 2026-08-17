import { CardDefinition } from '../../types/CardDefinition.js';

export const duplicate: CardDefinition = {
    id: 'duplicate',
    name: 'Copie',
    types: ['ACTION', 'RESERVE'],
    cost: 4,
    expansion: 'adventures',
    set: 'adventures',
    description: 'Mettez cette carte sur votre tapis de Réserve. Réserve: Quand vous gagnez une carte coûtant jusqu\'à 6 💰, appelez cette carte pour gagner une copie de cette carte.',
    effects: [
        { type: 'MOVE_TO_TAVERN_MAT' }
    ] as any
};
