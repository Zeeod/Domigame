import { CardDefinition } from '../../types/CardDefinition.js';

export const distantLands: CardDefinition = {
    id: 'distant_lands',
    name: 'Terres lointaines',
    types: ['ACTION', 'RESERVE', 'VICTORY'],
    cost: 5,
    expansion: 'adventures',
    set: 'adventures',
    description: 'Mettez cette carte sur votre tapis de Réserve. Vaut 4 PV si sur votre tapis de Réserve, sinon 0.',
    victoryPoints: 0, // Dynamic: 4 if on Reserve mat
    effects: [
        { type: 'MOVE_TO_TAVERN_MAT' }
    ] as any
};
