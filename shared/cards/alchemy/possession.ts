import { CardDefinition } from '../../types/CardDefinition.js';

export const Possession: CardDefinition = {
    id: 'possession',
    name: 'Possession',
    types: ['ACTION'],
    cost: 6,
    potionCost: 1,
    expansion: 'alchemy',
    set: 'Alchemy',
    description: "Le joueur à votre gauche joue un tour supplémentaire après celui-ci, durant lequel vous pouvez voir toutes les cartes qu'il peut voir et prendre toutes les décisions pour lui.\n\nToutes les cartes qu'il recevrait durant ce tour, vous les recevez à sa place; toutes les cartes qu'il écarte durant ce tour sont mises de côté et défaussées à la fin du tour.",
    effects: [
        {
            // Full implementation of Possession requires engine support for 'controlling another player'
            // and 'redirecting gains'. This is a placeholder effect.
            type: 'SCHEDULE_EXTRA_TURN',
            // We would need a 'POSSESSION_TURN' type or flag here, but SCHEDULE_EXTRA_TURN mainly schedules 'OUTPOST' or similar.
            // For now, we use standard extra turn logic, but the engine needs to handle the 'control' aspect.
        } as any
    ]
};
