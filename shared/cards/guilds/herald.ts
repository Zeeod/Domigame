import { CardDefinition } from '../../types/CardDefinition.js';

export const herald: CardDefinition = {
    id: 'herald',
    name: 'Héraut',
    types: ['ACTION'],
    cost: 4,
    expansion: 'guilds',
    description: '+1 Carte, +1 Action. Dévoilez la carte du dessus de votre pioche. Si c\'est une carte Action, jouez-la. Surpaiement : par 💰 surpayé, placez une carte de votre défausse sur votre pioche.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'HERALD' }
    ] as any,
    // Note: Overpay needs special buy phase handling,
    overpayEffects: [{ type: 'HERALD_OVERPAY' }] as any
};
