import { CardDefinition } from '../../types/CardDefinition.js';

export const catapult_rocks_pile: CardDefinition = {
    id: 'catapult_rocks_pile',
    name: 'Catapulte / Pierres',
    types: ['ACTION', 'ATTACK'],
    cost: 3,
    description: "Cette pile commence avec 5 exemplaires de la Catapulte sur le dessus, puis 5 exemplaires des Pierres dessous. Seule la carte du dessus de la pile peut être gagnée ou achetée.",
    expansion: 'empires',
    set: 'empires',
    isPile: true as any,
    mixedPile: {
        type: 'ORDERED',
        cards: [
            ...Array(5).fill('rocks'),
            ...Array(5).fill('catapult')
        ]
    }
};

export const encampment_plunder_pile: CardDefinition = {
    id: 'encampment_plunder_pile',
    name: 'Campement / Butin',
    types: ['ACTION'],
    cost: 2,
    description: "Cette pile commence avec 5 exemplaires du Campement sur le dessus, puis 5 exemplaires du Butin dessous. Seule la carte du dessus de la pile peut être gagnée ou achetée.",
    expansion: 'empires',
    set: 'empires',
    isPile: true as any,
    mixedPile: {
        type: 'ORDERED',
        cards: [
            ...Array(5).fill('plunder'),
            ...Array(5).fill('encampment')
        ]
    }
};

export const gladiator_fortune_pile: CardDefinition = {
    id: 'gladiator_fortune_pile',
    name: 'Gladiateur / Fortune',
    types: ['ACTION'],
    cost: 3,
    description: "Cette pile commence avec 5 exemplaires du Gladiateur sur le dessus, puis 5 exemplaires de la Fortune dessous. Seule la carte du dessus de la pile peut être gagnée ou achetée.",
    expansion: 'empires',
    set: 'empires',
    isPile: true as any,
    mixedPile: {
        type: 'ORDERED',
        cards: [
            ...Array(5).fill('fortune'),
            ...Array(5).fill('gladiator')
        ]
    }
};

export const patrician_emporium_pile: CardDefinition = {
    id: 'patrician_emporium_pile',
    name: 'Patricien / Emporium',
    types: ['ACTION'],
    cost: 2,
    description: "Cette pile commence avec 5 exemplaires du Patricien sur le dessus, puis 5 exemplaires de l'Emporium dessous. Seule la carte du dessus de la pile peut être gagnée ou achetée.",
    expansion: 'empires',
    set: 'empires',
    isPile: true as any,
    mixedPile: {
        type: 'ORDERED',
        cards: [
            ...Array(5).fill('emporium'),
            ...Array(5).fill('patrician')
        ]
    }
};

export const settlers_bustling_village_pile: CardDefinition = {
    id: 'settlers_bustling_village_pile',
    name: 'Colons / Village grouillant',
    types: ['ACTION'],
    cost: 2,
    description: "Cette pile commence avec 5 exemplaires des Colons sur le dessus, puis 5 exemplaires du Village grouillant dessous. Seule la carte du dessus de la pile peut être gagnée ou achetée.",
    expansion: 'empires',
    set: 'empires',
    isPile: true as any,
    mixedPile: {
        type: 'ORDERED',
        cards: [
            ...Array(5).fill('bustling_village'),
            ...Array(5).fill('settlers')
        ]
    }
};

export const castles_pile: CardDefinition = {
    id: 'castles_pile',
    name: 'Châteaux',
    types: ['VICTORY', 'CASTLE'],
    cost: 3,
    description: "Cette pile commence avec 8 Châteaux différents, du moins cher au plus cher. Seule la carte du dessus de la pile peut être gagnée ou achetée.",
    expansion: 'empires',
    set: 'empires',
    isPile: true as any,
    mixedPile: {
        type: 'ORDERED',
        cards: [
            'kings_castle',
            'grand_castle',
            'sprawling_castle',
            'opulent_castle',
            'haunted_castle',
            'small_castle',
            'crumbling_castle',
            'humble_castle'
        ]
    }
};
