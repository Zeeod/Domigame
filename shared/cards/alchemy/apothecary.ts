import { CardDefinition } from '../../types/CardDefinition.js';

export const Apothecary: CardDefinition = {
    id: 'apothecary',
    name: 'Apothicaire',
    types: ['ACTION'],
    cost: 2,
    potionCost: 1,
    expansion: 'alchemy',
    description: '+1 Carte, +1 Action. Dévoilez les 4 premières cartes de votre pioche. Prenez en main les Cuivres et les Potions. Replacez les autres dans l\'ordre de votre choix.',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'REVEAL_CARDS', amount: 4, source: 'deck', destination: 'limbo' },
        { type: 'MOVE_CARDS', source: 'limbo', destination: 'hand', count: 'ALL', filter: { cardIds: ['copper', 'potion'] } },
        { type: 'REORDER', sourceZone: 'limbo', destination: 'deck', position: 'TOP', message: 'Apothicaire : remettez les cartes sur votre pioche dans l\'ordre de votre choix' }
    ] as any
};
