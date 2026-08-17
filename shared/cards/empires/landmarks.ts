import { CardDefinition } from '../../types/CardDefinition.js';

export const fountain: CardDefinition = {
    id: 'fountain',
    name: 'Fontaine',
    types: ['LANDMARK'],
    cost: 0,
    description: "À la fin de la partie, si vous avez au moins 15 Cuivres, 15 PV.",
    expansion: 'empires'
};

export const wolfDen: CardDefinition = {
    id: 'wolf_den',
    name: 'Tanière de Loup',
    types: ['LANDMARK'],
    cost: 0,
    description: "À la fin de la partie, -3 PV par carte que vous n'avez qu'en un seul exemplaire.",
    expansion: 'empires'
};

export const aqueduct: CardDefinition = {
    id: 'aqueduct',
    name: 'Aqueduc',
    types: ['LANDMARK'],
    cost: 0,
    description: "Quand vous gagnez un Trésor, déplacez 1 PV de sa pile vers ici. Quand vous gagnez une Victoire, prenez les PV d'ici.",
    expansion: 'empires'
};

export const arena: CardDefinition = {
    id: 'arena',
    name: 'Arène',
    types: ['LANDMARK'],
    cost: 0,
    description: "Au début de votre phase d'Achat, vous pouvez défausser une carte Action. Si vous le faites, prenez 2 PV d'ici.",
    expansion: 'empires'
};

export const banditFort: CardDefinition = {
    id: 'bandit_fort',
    name: 'Fort de Brigands',
    types: ['LANDMARK'],
    cost: 0,
    description: "En fin de partie, -2 PV par Argent et Or que vous possédez.",
    expansion: 'empires'
};

export const basilica: CardDefinition = {
    id: 'basilica',
    name: 'Basilique',
    types: ['LANDMARK'],
    cost: 0,
    description: "Quand vous achetez une carte coûtant 2$ ou plus, si vous avez 2$ ou plus restants, prenez 2 PV d'ici.",
    expansion: 'empires'
};

export const baths: CardDefinition = {
    id: 'baths',
    name: 'Thermes',
    types: ['LANDMARK'],
    cost: 0,
    description: "À la fin de votre tour, si vous n'avez pas gagné de carte, prenez 2 PV d'ici.",
    expansion: 'empires'
};

export const battlefield: CardDefinition = {
    id: 'battlefield',
    name: 'Champ de Bataille',
    types: ['LANDMARK'],
    cost: 0,
    description: "Quand vous gagnez une carte Victoire, prenez 2 PV d'ici.",
    expansion: 'empires'
};

export const colonnade: CardDefinition = {
    id: 'colonnade',
    name: 'Colonnade',
    types: ['LANDMARK'],
    cost: 0,
    description: "Quand vous achetez une carte Action si vous en avez déjà une copie en jeu, prenez 2 PV d'ici.",
    expansion: 'empires'
};

export const defiledShrine: CardDefinition = {
    id: 'defiled_shrine',
    name: 'Sanctuaire Profané',
    types: ['LANDMARK'],
    cost: 0,
    description: "Quand vous gagnez une carte Action, déplacez 1 PV d'une pile non-Rassemblement vers ici. Quand vous gagnez une Malédiction, prenez les PV d'ici.",
    expansion: 'empires'
};

export const keep: CardDefinition = {
    id: 'keep',
    name: 'Donjon',
    types: ['LANDMARK'],
    cost: 0,
    description: "À la fin de la partie, 5 PV par carte Trésor dont vous possédez le plus d'exemplaires (ou égalité).",
    expansion: 'empires'
};

export const labyrinth: CardDefinition = {
    id: 'labyrinth',
    name: 'Labyrinthe',
    types: ['LANDMARK'],
    cost: 0,
    description: "Quand vous gagnez votre 2ème carte en un tour, prenez 2 PV d'ici.",
    expansion: 'empires'
};

export const mountainPass: CardDefinition = {
    id: 'mountain_pass',
    name: 'Col de Montagne',
    types: ['LANDMARK'],
    cost: 0,
    description: "Quand la 1ère Province est gagnée, chaque joueur enchère une fois pour des PV (jusqu'à 40). Le meilleur enchérisseur prend les PV et autant de Dette.",
    expansion: 'empires'
};

export const museum: CardDefinition = {
    id: 'museum',
    name: 'Musée',
    types: ['LANDMARK'],
    cost: 0,
    description: "En fin de partie, 2 PV par carte de nom différent.",
    expansion: 'empires'
};

export const obelisk: CardDefinition = {
    id: 'obelisk',
    name: 'Obélisque',
    types: ['LANDMARK'],
    cost: 0,
    description: "En fin de partie, 2 PV par carte que vous possédez de la pile Action choisie au hasard au début.",
    expansion: 'empires'
};

export const orchard: CardDefinition = {
    id: 'orchard',
    name: 'Verger',
    types: ['LANDMARK'],
    cost: 0,
    description: "En fin de partie, 4 PV par carte Action dont vous possédez au moins 3 exemplaires.",
    expansion: 'empires'
};

export const palace: CardDefinition = {
    id: 'palace',
    name: 'Palais',
    types: ['LANDMARK'],
    cost: 0,
    description: "En fin de partie, 3 PV par série de [Cuivre-Argent-Or].",
    expansion: 'empires'
};

export const tomb: CardDefinition = {
    id: 'tomb',
    name: 'Tombeau',
    types: ['LANDMARK'],
    cost: 0,
    description: "Quand vous écartez une carte, +1 PV.",
    expansion: 'empires'
};

export const tower: CardDefinition = {
    id: 'tower',
    name: 'Tour',
    types: ['LANDMARK'],
    cost: 0,
    description: "En fin de partie, 1 PV par carte non-Victoire d'une pile de la réserve vide.",
    expansion: 'empires'
};

export const triumphalArch: CardDefinition = {
    id: 'triumphal_arch',
    name: 'Arc de Triomphe',
    types: ['LANDMARK'],
    cost: 0,
    description: "En fin de partie, 3 PV par exemplaire de votre 2ème carte Action la plus possèdée.",
    expansion: 'empires'
};

export const wall: CardDefinition = {
    id: 'wall',
    name: 'Mur',
    types: ['LANDMARK'],
    cost: 0,
    description: "En fin de partie, -1 PV par carte au delà de la 15ème.",
    expansion: 'empires'
};
