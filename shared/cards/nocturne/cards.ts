
import { CardDefinition } from '../../types/CardDefinition.js';

export const Bard: CardDefinition = {
    id: 'bard',
    name: 'Barde',
    types: ['ACTION', 'FATE'],
    cost: 4,
    expansion: 'nocturne',
    set: 'Nocturne',
    description: "+2 Pièces. Recevez une Aubaine.",
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'RECEIVE_BOON' }
    ]
};

export const BlessedVillage: CardDefinition = {
    id: 'blessed_village',
    name: 'Village Béni',
    types: ['ACTION', 'FATE'],
    cost: 4,
    expansion: 'nocturne',
    set: 'Nocturne',
    description: "+1 Carte, +2 Actions. Au moment où vous gagnez cette carte, prenez une Aubaine. Recevez cette Aubaine maintenant ou au début de votre prochain tour.",
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 2 }
    ],
    onGain: [
        { type: 'RECEIVE_BOON' } // Simplified
    ]
};

export const Changeling: CardDefinition = {
    id: 'changeling',
    name: 'Changeforme',
    types: ['NIGHT'],
    cost: 3,
    expansion: 'nocturne',
    set: 'Nocturne',
    description: "Écartez cette carte. Gagnez une copie d'une carte que vous avez gagnée pendant ce tour.",
    nightEffects: [
        { type: 'TRASH_SELF' },
        { type: 'GAIN_COPY_OF_TARGET' } // Logic needs refinement in engine
    ]
};

export const Cobbler: CardDefinition = {
    id: 'cobbler',
    name: 'Cordonnier',
    types: ['NIGHT', 'DURATION'],
    cost: 5,
    expansion: 'nocturne',
    set: 'Nocturne',
    description: "Au début de votre prochain tour, gagnez une carte coûtant jusqu'à 4 Pièces dans votre main.",
    durationTurns: 1,
    durationEffects: [
        {
            type: 'GAIN_CARD_FROM_SUPPLY',
            allowedTypes: ['ACTION', 'TREASURE', 'VICTORY'], // Any card from supply?
            maxCost: 4,
            destination: 'hand'
        }
    ]
};

export const Conclave: CardDefinition = {
    id: 'conclave',
    name: 'Conclave',
    types: ['ACTION'],
    cost: 4,
    expansion: 'nocturne',
    set: 'Nocturne',
    description: "+2 Pièces. Vous pouvez jouer une carte Action de votre main que vous n'avez pas en jeu. Si vous le faites, +1 Action.",
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        // Interactive choice needed
    ]
};

export const Crypt: CardDefinition = {
    id: 'crypt',
    name: 'Crypte',
    types: ['NIGHT', 'DURATION'],
    cost: 5,
    expansion: 'nocturne',
    set: 'Nocturne',
    description: "Mettez de côté n'importe quel nombre de Trésors que vous avez en jeu. Au début de chacun de vos tours, vous pouvez mettre une de ces cartes dans votre main.",
    nightEffects: [
        // Complex logic
    ]
};

export const CursedVillage: CardDefinition = {
    id: 'cursed_village',
    name: 'Village Maudit',
    types: ['ACTION', 'DOOM'],
    cost: 5,
    expansion: 'nocturne',
    set: 'Nocturne',
    description: "+2 Actions. Piochez jusqu'à ce que vous ayez 6 cartes en main. Recevez une Malédiction (Hex).",
    effects: [
        { type: 'ADD_ACTIONS', amount: 2 },
        { type: 'DRAW_UNTIL_HAND_SIZE', targetSize: 6 },
        { type: 'RECEIVE_HEX' }
    ]
};

export const DenOfSin: CardDefinition = {
    id: 'den_of_sin',
    name: 'Repaire du Péché',
    types: ['NIGHT', 'DURATION'],
    cost: 5,
    expansion: 'nocturne',
    set: 'Nocturne',
    description: "Au début de votre prochain tour : +2 Cartes.",
    durationTurns: 1,
    durationEffects: [
        { type: 'DRAW', amount: 2 }
    ]
};

export const DevilsWorkshop: CardDefinition = {
    id: 'devils_workshop',
    name: 'Atelier du Diable',
    types: ['NIGHT'],
    cost: 4,
    expansion: 'nocturne',
    set: 'Nocturne',
    description: "Si vous avez gagné 2 cartes ou plus à ce tour, gagnez un Lutin (Imp). Sinon, gagnez une carte coûtant jusqu'à 4 Pièces.",
    relatedCardIds: ['imp'],
    nightEffects: [
        // Conditional logic
    ]
};

export const Druid: CardDefinition = {
    id: 'druid',
    name: 'Druide',
    types: ['ACTION', 'FATE'],
    cost: 2,
    expansion: 'nocturne',
    set: 'Nocturne',
    description: "+1 Achat\n    Appliquez une des trois Aubaines mises de côté (laissez-la en place).\n    Mise en place : mettez de coté face visible les 3 premières Aubaines.",
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'DRUID_CHOOSE_BOON' }
    ]
};

export const FaithfulHound: CardDefinition = {
    id: 'faithful_hound',
    name: 'Chien Fidèle',
    cost: 2,
    types: ['ACTION', 'REACTION'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: "+2 Cartes. Si vous défaussez cette carte autrement que lors de votre phase de nettoyage, vous pouvez la mettre de côté et la reprendre en main au début de votre prochain tour.",
    effects: [
        { type: 'DRAW', amount: 2 }
    ],
    isReaction: true,
    reactionTrigger: 'DISCARD'
};

export const Fool: CardDefinition = {
    id: 'fool',
    name: 'Fou',
    types: ['ACTION', 'FATE'],
    cost: 3,
    expansion: 'nocturne',
    set: 'Nocturne',
    description: "Si vous avez perdu une Aubaine, prenez-la. Sinon : +1 Achat, +2 Pièces, recevez une Aubaine. Si vous avez reçu l'Aubaine qui permet de mélanger la défausse ou d'avoir +1 Pièce, perdez-la (tournez la carte face cachée).",
    heirloom: 'lucky_coin',
    effects: [
        // Complex logic
    ]
};

export const Guardian: CardDefinition = {
    id: 'guardian',
    name: 'Gardien',
    types: ['NIGHT', 'DURATION'],
    cost: 5,
    expansion: 'nocturne',
    set: 'Nocturne',
    description: "Jusqu'au début de votre prochain tour, quand un autre joueur joue une carte Attaque, elle ne vous affecte pas. Au début de votre prochain tour, +1 Pièce.",
    durationTurns: 1,
    durationEffects: [
        { type: 'ADD_MONEY', amount: 1 }
    ],
    nightEffects: [
        // Protection effect
    ]
};

export const Idol: CardDefinition = {
    id: 'idol',
    name: 'Idole',
    types: ['TREASURE', 'ATTACK', 'FATE'],
    cost: 5,
    expansion: 'nocturne',
    set: 'Nocturne',
    description: "2 Pièces. Recevez une Aubaine. Si le nombre d'Idoles que vous avez en jeu est impair, chaque autre joueur reçoit une Malédiction (Hex).",
    treasureValue: 2,
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'RECEIVE_BOON' },
        // Conditional attack
    ]
};

export const Leprechaun: CardDefinition = {
    id: 'leprechaun',
    name: 'Leprechaun',
    types: ['ACTION', 'DOOM'],
    cost: 3,
    expansion: 'nocturne',
    set: 'Nocturne',
    description: "Gagnez un Or. Si vous avez exactement 7 cartes en jeu, gagnez un Souhait (Wish). Sinon, recevez une Malédiction (Hex).",
    relatedCardIds: ['wish'],
    effects: [
        { type: 'GAIN_CARD', cardId: 'gold' },
        // Conditional
    ]
};

export const Necromancer: CardDefinition = {
    id: 'necromancer',
    name: 'Nécromancien',
    types: ['ACTION'],
    cost: 4,
    expansion: 'nocturne',
    set: 'Nocturne',
    description: "Jouez une carte Action face visible du tas de Rebut, ne l'écartant pas de là et la laissant là.",
    effects: [
        // Play from trash
    ]
};

export const Pixie: CardDefinition = {
    id: 'pixie',
    name: 'Pixie',
    types: ['ACTION', 'FATE'],
    cost: 4,
    expansion: 'nocturne',
    set: 'Nocturne',
    description: "+1 Carte, +1 Action. Choisissez-en un : +2 Pièces ; ou recevez une Aubaine. En recevant l'Aubaine, vous pouvez écarter cette carte pour gagner l'Aubaine deux fois (prenez des copies).",
    heirloom: 'goat',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'CHOICE', options: ['+2 Pièces', 'Recevoir une Aubaine'], effects: {} }
    ]
};

export const Pooka: CardDefinition = {
    id: 'pooka',
    name: 'Pooka',
    types: ['ACTION'],
    cost: 5,
    expansion: 'nocturne',
    set: 'Nocturne',
    description: "Vous pouvez écarter une carte Trésor (autre que Cursed Gold) de votre main pour +4 Cartes.",
    heirloom: 'cursed_gold',
    effects: [
        // Choice
    ]
};

export const Raider: CardDefinition = {
    id: 'raider',
    name: 'Pillard',
    types: ['NIGHT', 'DURATION', 'ATTACK'],
    cost: 5,
    expansion: 'nocturne',
    set: 'Nocturne',
    description: "Chaque autre joueur ayant 5 cartes ou plus défausse une copie d'une carte qu'il a en jeu (ou révèle qu'il ne peut pas). Au début de votre prochain tour, +3 Pièces.",
    nightEffects: [
        { type: 'BANDIT_ATTACK' } // Placeholder for custom attack
    ],
    durationTurns: 1,
    durationEffects: [
        { type: 'ADD_MONEY', amount: 3 }
    ]
};

export const SacredGrove: CardDefinition = {
    id: 'sacred_grove',
    name: 'Bosquet Sacré',
    types: ['ACTION', 'FATE'],
    cost: 5,
    expansion: 'nocturne',
    set: 'Nocturne',
    description: "+1 Achat, +3 Pièces. Recevez une Aubaine. Si vous en avez choisi une qui donne +1 Pièce ou +1 Achat, vous pouvez recevoir cette Aubaine à nouveau.",
    effects: [
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'ADD_MONEY', amount: 3 },
        { type: 'RECEIVE_BOON' }
    ]
};

export const SecretCave: CardDefinition = {
    id: 'secret_cave',
    name: 'Grotte Secrète',
    types: ['ACTION', 'DURATION'],
    cost: 3,
    expansion: 'nocturne',
    set: 'Nocturne',
    description: "+1 Carte, +1 Action. Vous pouvez défausser 3 cartes. Si vous le faites, +3 Pièces et activez ce tour.",
    heirloom: 'magic_lamp',
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        // Conditional discard for money+duration
    ]
};

export const Tormentor: CardDefinition = {
    id: 'tormentor',
    name: 'Tourmenteur',
    types: ['ACTION', 'ATTACK', 'DOOM'],
    cost: 5,
    expansion: 'nocturne',
    set: 'Nocturne',
    description: "+2 Pièces. Si vous n'avez pas d'autres cartes en jeu, gagnez un Lutin (Imp). Sinon, chaque autre joueur reçoit une Malédiction (Hex).",
    relatedCardIds: ['imp'],
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        // Conditional
    ]
};

export const TragicHero: CardDefinition = {
    id: 'tragic_hero',
    name: 'Héros Tragique',
    types: ['ACTION'],
    cost: 5,
    expansion: 'nocturne',
    set: 'Nocturne',
    description: "+3 Cartes, +1 Achat. Si vous avez 8 cartes ou plus en main (en comptant celle-ci), écartez cette carte et gagnez un Trésor.",
    effects: [
        { type: 'DRAW', amount: 3 },
        { type: 'ADD_BUYS', amount: 1 },
        // Conditional trash
    ]
};

export const Vampire: CardDefinition = {
    id: 'vampire',
    name: 'Vampire',
    types: ['NIGHT', 'ATTACK', 'DOOM'],
    cost: 5,
    expansion: 'nocturne',
    set: 'Nocturne',
    description: "Chaque autre joueur reçoit une Malédiction (Hex). Gagnez une Chauve-Souris (Bat) du tas de cartes non-disponibles ou de la poubelle, échangez-la avec cette carte.",
    relatedCardIds: ['bat'],
    nightEffects: [
        // Attack + Exchange
    ]
};

export const Werewolf: CardDefinition = {
    id: 'werewolf',
    name: 'Loup-Garou',
    types: ['ACTION', 'NIGHT', 'ATTACK', 'DOOM'],
    cost: 5,
    expansion: 'nocturne',
    set: 'Nocturne',
    description: "Si c'est votre phase Nuit, chaque autre joueur reçoit une Malédiction (Hex). Sinon, +3 Cartes.",
    effects: [
        { type: 'DRAW', amount: 3 }
    ],
    nightEffects: [
        { type: 'RECEIVE_HEX' } // Plus attack on others?
    ]
};
