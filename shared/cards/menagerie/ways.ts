
import { LandscapeDefinition } from '../../types/LandscapeDefinition.js';

export const WayOfTheButterfly: LandscapeDefinition = {
    id: 'way_of_the_butterfly',
    name: 'Voie du Papillon',
    types: ['WAY'],
    expansion: 'Menagerie',
    onPlay: [
        { type: 'WAY_BUTTERFLY_EFFECT' }
    ]
};

export const WayOfTheCamel: LandscapeDefinition = {
    id: 'way_of_the_camel',
    name: 'Voie du Chameau',
    types: ['WAY'],
    expansion: 'Menagerie',
    onPlay: [
        { type: 'GAIN_CARD', cardId: 'gold', destination: 'exile' }
    ]
};

export const WayOfTheChameleon: LandscapeDefinition = {
    id: 'way_of_the_chameleon',
    name: 'Voie du Caméléon',
    types: ['WAY'],
    expansion: 'Menagerie',
    onPlay: [
        { type: 'ADD_MONEY', amount: 1 }
        // Note: Full logic requires ActionResolver hook for swapping +Cards and +Coins
    ]
};

export const WayOfTheFrog: LandscapeDefinition = {
    id: 'way_of_the_frog',
    name: 'Voie de la Grenouille',
    types: ['WAY'],
    expansion: 'Menagerie',
    onPlay: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'TOPDECK_WHEN_DISCARDED' }
    ]
};

export const WayOfTheGoat: LandscapeDefinition = {
    id: 'way_of_the_goat',
    name: 'Voie de la Chèvre',
    types: ['WAY'],
    expansion: 'Menagerie',
    onPlay: [
        { type: 'TRASH', amount: 1, source: 'hand' }
    ]
};

export const WayOfTheHorse: LandscapeDefinition = {
    id: 'way_of_the_horse',
    name: 'Voie du Cheval',
    types: ['WAY'],
    expansion: 'Menagerie',
    onPlay: [
        { type: 'ADD_ACTIONS', amount: 2 },
        { type: 'DRAW', amount: 1 },
        { type: 'RETURN_TO_PILE' }
    ]
};

export const WayOfTheMole: LandscapeDefinition = {
    id: 'way_of_the_mole',
    name: 'Voie de la Taupe',
    types: ['WAY'],
    expansion: 'Menagerie',
    onPlay: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'DISCARD_HAND' },
        { type: 'DRAW', amount: 3 }
    ]
};

export const WayOfTheMonkey: LandscapeDefinition = {
    id: 'way_of_the_monkey',
    name: 'Voie du Singe',
    types: ['WAY'],
    expansion: 'Menagerie',
    onPlay: [
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'ADD_MONEY', amount: 1 }
    ]
};

export const WayOfTheMouse: LandscapeDefinition = {
    id: 'way_of_the_mouse',
    name: 'Voie de la Souris',
    types: ['WAY'],
    expansion: 'Menagerie',
    onPlay: [] // Special setup logic needed
};

export const WayOfTheMule: LandscapeDefinition = {
    id: 'way_of_the_mule',
    name: 'Voie de la Mule',
    types: ['WAY'],
    expansion: 'Menagerie',
    onPlay: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'ADD_MONEY', amount: 1 }
    ]
};

export const WayOfTheOtter: LandscapeDefinition = {
    id: 'way_of_the_otter',
    name: 'Voie de la Loutre',
    types: ['WAY'],
    expansion: 'Menagerie',
    onPlay: [
        { type: 'DRAW', amount: 2 }
    ]
};

export const WayOfTheOwl: LandscapeDefinition = {
    id: 'way_of_the_owl',
    name: 'Voie de la Chouette',
    types: ['WAY'],
    expansion: 'Menagerie',
    onPlay: [
        { type: 'DRAW_UNTIL_HAND_SIZE', targetSize: 6 }
    ]
};

export const WayOfTheOx: LandscapeDefinition = {
    id: 'way_of_the_ox',
    name: 'Voie du Bœuf',
    types: ['WAY'],
    expansion: 'Menagerie',
    onPlay: [
        { type: 'ADD_ACTIONS', amount: 2 }
    ]
};

export const WayOfThePig: LandscapeDefinition = {
    id: 'way_of_the_pig',
    name: 'Voie du Cochon',
    types: ['WAY'],
    expansion: 'Menagerie',
    onPlay: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 }
    ]
};

export const WayOfTheRat: LandscapeDefinition = {
    id: 'way_of_the_rat',
    name: 'Voie du Rat',
    types: ['WAY'],
    expansion: 'Menagerie',
    onPlay: [
        { type: 'GAIN_COPY_OF_SELF' }
    ]
};

export const WayOfTheSeal: LandscapeDefinition = {
    id: 'way_of_the_seal',
    name: 'Voie du Phoque',
    types: ['WAY'],
    expansion: 'Menagerie',
    onPlay: [
        { type: 'ADD_MONEY', amount: 1 }
        // Special trigger for topdecking gains
    ]
};

export const WayOfTheSheep: LandscapeDefinition = {
    id: 'way_of_the_sheep',
    name: 'Voie du Mouton',
    types: ['WAY'],
    expansion: 'Menagerie',
    onPlay: [
        { type: 'ADD_MONEY', amount: 2 }
    ]
};

export const WayOfTheSquirrel: LandscapeDefinition = {
    id: 'way_of_the_squirrel',
    name: 'Voie de l\'Écureuil',
    types: ['WAY'],
    expansion: 'Menagerie',
    onPlay: [
        { type: 'DRAW_AT_END_OF_TURN' }
    ]
};

export const WayOfTheTurtle: LandscapeDefinition = {
    id: 'way_of_the_turtle',
    name: 'Voie de la Tortue',
    types: ['WAY'],
    expansion: 'Menagerie',
    onPlay: [
        { type: 'SET_ASIDE_FOR_NEXT_TURN' }
    ]
};

export const WayOfTheWorm: LandscapeDefinition = {
    id: 'way_of_the_worm',
    name: 'Voie du Ver',
    types: ['WAY'],
    expansion: 'Menagerie',
    onPlay: [
        { type: 'EXILE_SELF' }
        // Add logic for +1 card per card of name in Exile
    ]
};
