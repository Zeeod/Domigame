import { CardDefinition } from '../../types/CardDefinition.js';

export const sauna: CardDefinition = {
    id: 'sauna',
    name: 'Sauna',
    cost: 4,
    types: ['ACTION'],
    description: "+1 Carte. +1 Action. Vous pouvez jouer un Avanto de votre main. Tant que cette carte est en jeu, quand vous jouez un Argent, vous pouvez écarter une carte de votre main.",
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'PLAY_TARGET', filter: { cardIds: ['avanto'] }, optional: true, message: 'Vous pouvez jouer un Avanto' } as any
    ],
    triggers: [
        {
            trigger: 'ON_PLAY',
            filter: { cardIds: ['silver'] },
            effects: [{ type: 'TRASH', min: 0, max: 1, source: 'hand', message: 'Sauna : vous pouvez écarter une carte de votre main' } as any]
        }
    ],
    expansion: 'promos',
    isSubCard: true
};

export const avanto: CardDefinition = {
    id: 'avanto',
    name: 'Avanto',
    cost: 5,
    types: ['ACTION'],
    description: "+3 Cartes. Vous pouvez jouer un Sauna de votre main.",
    effects: [
        { type: 'DRAW', amount: 3 },
        { type: 'PLAY_TARGET', filter: { cardIds: ['sauna'] }, optional: true, message: 'Vous pouvez jouer un Sauna' } as any
    ],
    expansion: 'promos',
    isSubCard: true
};

export const sauna_avanto_pile: CardDefinition = {
    id: 'sauna_avanto_pile',
    name: 'Sauna / Avanto',
    cost: 4,
    types: ['ACTION'],
    description: "Une pile de 10 cartes : 5 Saunas sur 5 Avantos.",
    expansion: 'promos',
    isPile: true,
    mixedPile: {
        type: 'ORDERED',
        cards: ['sauna', 'sauna', 'sauna', 'sauna', 'sauna', 'avanto', 'avanto', 'avanto', 'avanto', 'avanto']
    }
};
