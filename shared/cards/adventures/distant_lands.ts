import { CardDefinition } from '../../types/CardDefinition.js';

export const distantLands: CardDefinition = {
    id: 'distant_lands',
    name: 'Terres lointaines',
    types: ['ACTION', 'RESERVE', 'VICTORY'],
    cost: 5,
    expansion: 'adventures',
    description: 'Placez cette carte sur votre plateau Taverne. Vaut 4 PV si elle est sur votre plateau Taverne à la fin de la partie (sinon 0 PV).',
    victoryPoints: 0, // Dynamic: 4 if on Reserve mat
    effects: [
        { type: 'MOVE_TO_TAVERN_MAT' }
    ] as any,
    vpOnMat: { mat: 'tavern', vp: 4 }
};
