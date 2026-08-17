import { CardDefinition } from '../../types/CardDefinition.js';

export const herald: CardDefinition = {
    id: 'herald',
    name: 'Héraut',
    types: ['ACTION'],
    cost: 4,
    expansion: 'guilds',
    set: 'guilds',
    description: '+1 Carte, +1 Action. Révélez la carte du dessus de votre pioche. Si c\'est une Action, jouez-la. Surprix: Mettez une carte de votre défausse sur votre pioche.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        {
            type: 'REVEAL_TOP_DECK',
            amount: 1,
            onAction: [{ type: 'PLAY_CARD' }]
        }
    ] as any
    // Note: Overpay needs special buy phase handling
};
