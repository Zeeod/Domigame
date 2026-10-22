import { CardDefinition } from '../../types/CardDefinition.js';

export const Possession: CardDefinition = {
    id: 'possession',
    name: 'Possession',
    types: ['ACTION'],
    cost: 6,
    potionCost: 1,
    expansion: 'alchemy',
    description: "Le joueur à votre gauche joue un tour supplémentaire après celui-ci, durant lequel vous pouvez voir toutes les cartes qu'il peut voir et prendre toutes les décisions pour lui.\n\nToutes les cartes qu'il recevrait durant ce tour, vous les recevez à sa place; toutes les cartes qu'il écarte durant ce tour sont mises de côté et défaussées à la fin du tour.",
    effects: [{ type: 'POSSESSION' }] as any
};
