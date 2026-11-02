import { CardDefinition } from '../../types/CardDefinition';

export const smugglers: CardDefinition = {
    id: 'smugglers',
    name: 'Contrebandiers',
    types: ['ACTION'],
    description: 'Gagnez une copie d\'une carte coûtant jusqu\'à 6 Pièces gagnée par le joueur à votre droite lors de son dernier tour.',
    cost: 3,
    expansion: 'seaside',
    effects: [
        { type: 'SMUGGLERS' }
    ] as any
};
