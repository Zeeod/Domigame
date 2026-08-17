import { CardDefinition } from '../../types/CardDefinition.js';

export const sauna: CardDefinition = {
    id: 'sauna',
    name: 'Sauna',
    cost: 4,
    types: ['ACTION'],
    description: "+1 Carte. +1 Action. Vous pouvez jouer un Avanto de votre main. (Cette carte fait partie d'une pile Sauna/Avanto).",
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'CHOOSE_OPTION', message: 'Jouer un Avanto ?', options: [{ label: 'Oui', effects: [{ type: 'PLAY_TARGET' as any, filter: { cardIds: ['avanto'] } }] }, { label: 'Non', effects: [] }] }
    ],
    expansion: 'promos',
    isSubCard: true
};

export const avanto: CardDefinition = {
    id: 'avanto',
    name: 'Avanto',
    cost: 5,
    types: ['ACTION'],
    description: "+3 Cartes. Vous pouvez jouer un Sauna de votre main. (Cette carte fait partie d'une pile Sauna/Avanto).",
    effects: [
        { type: 'DRAW', amount: 3 },
        { type: 'CHOOSE_OPTION', message: 'Jouer un Sauna ?', options: [{ label: 'Oui', effects: [{ type: 'PLAY_TARGET' as any, filter: { cardIds: ['sauna'] } }] }, { label: 'Non', effects: [] }] }
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
