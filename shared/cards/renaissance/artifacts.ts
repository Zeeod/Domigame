
import { CardDefinition } from '../../types/CardDefinition.js';

export const Flag: CardDefinition = {
    id: 'flag',
    name: 'Drapeau',
    types: ['ARTIFACT'],
    cost: 0,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "Au moment où vous piochez votre main : +1 Carte.",
    isNonSupply: true,
    effects: []
};

export const Horn: CardDefinition = {
    id: 'horn',
    name: 'Cor',
    types: ['ARTIFACT'],
    cost: 0,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "Une fois par tour, quand vous écartez une carte Bordure (Border Guard) du jeu : placez-la sur votre deck.",
    isNonSupply: true,
    effects: []
};

export const Key: CardDefinition = {
    id: 'key',
    name: 'Clé',
    types: ['ARTIFACT'],
    cost: 0,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "Au début de votre tour : +1 Pièce.",
    isNonSupply: true,
    effects: []
};

export const Lantern: CardDefinition = {
    id: 'lantern',
    name: 'Lanterne',
    types: ['ARTIFACT'],
    cost: 0,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "Vos Gardes-Frontières (Border Guards) révèlent 3 cartes et en défaussent 2.",
    isNonSupply: true,
    effects: []
};

export const TreasureChest: CardDefinition = {
    id: 'treasure_chest',
    name: 'Coffre au Trésor',
    types: ['ARTIFACT'],
    cost: 0,
    expansion: 'renaissance',
    set: 'Renaissance',
    description: "Au début de votre phase d'Achat : +1 Or.",
    isNonSupply: true,
    effects: []
}; // Gold gain logic? Or +1 Gold (money)? Wiki says "gain a Gold".
