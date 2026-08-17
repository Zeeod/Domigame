import { CardDefinition } from '../../types/CardDefinition.js';

export const augurs_pile: CardDefinition = {
    id: 'augurs_pile',
    name: 'Augures',
    types: ['ACTION'],
    cost: 3,
    description: "Une pile de 16 cartes : 4 Cueilleuses d'herbes, 4 Acolytes, 4 Enchanteresses et 4 Sibylles.",
    expansion: 'allies',
    isPile: true,
    mixedPile: {
        type: 'ROTATING',
        cards: [
            'sibyl', 'sibyl', 'sibyl', 'sibyl',
            'sorceress', 'sorceress', 'sorceress', 'sorceress',
            'acolyte', 'acolyte', 'acolyte', 'acolyte',
            'herb_gatherer', 'herb_gatherer', 'herb_gatherer', 'herb_gatherer'
        ]
    }
};

export const clashes_pile: CardDefinition = {
    id: 'clashes_pile',
    name: 'Combats',
    types: ['ACTION'],
    cost: 3,
    description: "Une pile de 16 cartes : 4 Plans de bataille, 4 Archers, 4 Seigneurs de guerre et 4 Territoires.",
    expansion: 'allies',
    isPile: true,
    mixedPile: {
        type: 'ROTATING',
        cards: [
            'territory', 'territory', 'territory', 'territory',
            'warlord', 'warlord', 'warlord', 'warlord',
            'archer', 'archer', 'archer', 'archer',
            'battle_plan', 'battle_plan', 'battle_plan', 'battle_plan'
        ]
    }
};

export const forts_pile: CardDefinition = {
    id: 'forts_pile',
    name: 'Forts',
    types: ['ACTION'],
    cost: 3,
    description: "Une pile de 16 cartes : 4 Tentes, 4 Garnisons, 4 Forts de colline et 4 Forteresses.",
    expansion: 'allies',
    isPile: true,
    mixedPile: {
        type: 'ROTATING',
        cards: [
            'stronghold', 'stronghold', 'stronghold', 'stronghold',
            'hill_fort', 'hill_fort', 'hill_fort', 'hill_fort',
            'garrison', 'garrison', 'garrison', 'garrison',
            'tent', 'tent', 'tent', 'tent'
        ]
    }
};

export const odysseys_pile: CardDefinition = {
    id: 'odysseys_pile',
    name: 'Odyssées',
    types: ['ACTION'],
    cost: 3,
    description: "Une pile de 16 cartes : 4 Vieilles cartes, 4 Voyages, 4 Trésors engloutis et 4 Rives lointaines.",
    expansion: 'allies',
    isPile: true,
    mixedPile: {
        type: 'ROTATING',
        cards: [
            'distant_shore', 'distant_shore', 'distant_shore', 'distant_shore',
            'sunken_treasure', 'sunken_treasure', 'sunken_treasure', 'sunken_treasure',
            'voyage', 'voyage', 'voyage', 'voyage',
            'old_map', 'old_map', 'old_map', 'old_map'
        ]
    }
};

export const townsfolk_pile: CardDefinition = {
    id: 'townsfolk_pile',
    name: 'Citadins',
    types: ['ACTION'],
    cost: 2,
    description: "Une pile de 16 cartes : 4 Crieurs publics, 4 Forgerons, 4 Meuniers et 4 Anciens.",
    expansion: 'allies',
    isPile: true,
    mixedPile: {
        type: 'ROTATING',
        cards: [
            'elder', 'elder', 'elder', 'elder',
            'miller', 'miller', 'miller', 'miller',
            'town_blacksmith', 'town_blacksmith', 'town_blacksmith', 'town_blacksmith',
            'town_crier', 'town_crier', 'town_crier', 'town_crier'
        ]
    }
};

export const wizards_pile: CardDefinition = {
    id: 'wizards_pile',
    name: 'Sorciers',
    types: ['ACTION', 'LIAISON'],
    cost: 3,
    description: "Une pile de 16 cartes : 4 Étudiants, 4 Illusionnistes, 4 Sorciers et 4 Liches.",
    expansion: 'allies',
    isPile: true,
    mixedPile: {
        type: 'ROTATING',
        cards: [
            'lich', 'lich', 'lich', 'lich',
            'sorcerer_wizard', 'sorcerer_wizard', 'sorcerer_wizard', 'sorcerer_wizard',
            'conjurer', 'conjurer', 'conjurer', 'conjurer',
            'student', 'student', 'student', 'student'
        ]
    }
};
