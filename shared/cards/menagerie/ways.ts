import { LandscapeDefinition } from '../../types/LandscapeDefinition.js';

/** Menagerie — the 20 Ways (official texts). Played instead of the card's instructions. */
const way = (id: string, name: string, description: string, onPlay: any[]): LandscapeDefinition => ({
    id, name, types: ['WAY'], expansion: 'menagerie', description, onPlay
} as any);

export const WayOfTheButterfly = way('way_of_the_butterfly', 'Voie du papillon', 'Vous pouvez remettre cette carte sur sa pile pour recevoir une carte coûtant exactement 1 💰 de plus.', [{ type: 'WAY_BUTTERFLY' }]);
export const WayOfTheCamel = way('way_of_the_camel', 'Voie du chameau', 'Exilez un Or de la réserve.', [{ type: 'EXILE_FROM_SUPPLY', cardId: 'gold' }]);
export const WayOfTheChameleon = way('way_of_the_chameleon', 'Voie du caméléon', 'Suivez les instructions de cette carte ; chaque fois que cela vous donnerait +Cartes, recevez +💰 à la place, et inversement.', [{ type: 'NOOP' }]);
export const WayOfTheFrog = way('way_of_the_frog', 'Voie de la grenouille', '+1 Action. Quand vous défaussez cette carte du jeu ce tour-ci, vous pouvez la placer sur votre pioche.', [{ type: 'ADD_ACTIONS', amount: 1 }, { type: 'WAY_FROG' }]);
export const WayOfTheGoat = way('way_of_the_goat', 'Voie de la chèvre', 'Écartez une carte de votre main.', [{ type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Voie de la chèvre : écartez une carte' }]);
export const WayOfTheHorse = way('way_of_the_horse', 'Voie du cheval', '+2 Cartes, +1 Action. Remettez cette carte sur sa pile.', [{ type: 'DRAW', amount: 2 }, { type: 'ADD_ACTIONS', amount: 1 }, { type: 'RETURN_TO_PILE' }]);
export const WayOfTheMole = way('way_of_the_mole', 'Voie de la taupe', '+1 Action. Défaussez votre main. +3 Cartes.', [{ type: 'ADD_ACTIONS', amount: 1 }, { type: 'DISCARD', forceAll: true }, { type: 'DRAW', amount: 3 }]);
export const WayOfTheMonkey = way('way_of_the_monkey', 'Voie du singe', '+1 Achat, +1 💰.', [{ type: 'ADD_BUYS', amount: 1 }, { type: 'ADD_MONEY', amount: 1 }]);
export const WayOfTheMouse = way('way_of_the_mouse', 'Voie de la souris', 'Jouez la carte mise de côté, en l\'y laissant. Mise en place : mettez de côté une carte Action inutilisée coûtant 2 ou 3 💰.', [{ type: 'WAY_MOUSE' }]);
export const WayOfTheMule = way('way_of_the_mule', 'Voie de la mule', '+1 Action, +1 💰.', [{ type: 'ADD_ACTIONS', amount: 1 }, { type: 'ADD_MONEY', amount: 1 }]);
export const WayOfTheOtter = way('way_of_the_otter', 'Voie de la loutre', '+2 Cartes.', [{ type: 'DRAW', amount: 2 }]);
export const WayOfTheOwl = way('way_of_the_owl', 'Voie du hibou', 'Piochez jusqu\'à avoir 6 cartes en main.', [{ type: 'DRAW_UNTIL_HAND_SIZE', targetSize: 6 }]);
export const WayOfTheOx = way('way_of_the_ox', 'Voie du bœuf', '+2 Actions.', [{ type: 'ADD_ACTIONS', amount: 2 }]);
export const WayOfThePig = way('way_of_the_pig', 'Voie du cochon', '+1 Carte, +1 Action.', [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 }]);
export const WayOfTheRat = way('way_of_the_rat', 'Voie du rat', 'Vous pouvez défausser un Trésor pour recevoir une copie de cette carte.', [{ type: 'WAY_RAT' }]);
export const WayOfTheSeal = way('way_of_the_seal', 'Voie du phoque', '+1 💰. Ce tour-ci, quand vous recevez une carte, vous pouvez la placer sur votre pioche.',
    [{ type: 'ADD_MONEY', amount: 1 }, { type: 'REGISTER_TRIGGER', trigger: 'ON_GAIN', duration: 'TURN', repeat: true, description: 'Voie du phoque',
        effects: [{ type: 'SELECT_OPTION', message: 'Voie du phoque : placer la carte reçue sur votre pioche ?', options: [
            { label: 'Oui', effects: [{ type: 'GAINED_CARD_TO', to: 'deck' }] }, { label: 'Non', effects: [] }] }] }]);
export const WayOfTheSheep = way('way_of_the_sheep', 'Voie du mouton', '+2 💰.', [{ type: 'ADD_MONEY', amount: 2 }]);
export const WayOfTheSquirrel = way('way_of_the_squirrel', 'Voie de l\'écureuil', '+2 Cartes à la fin de ce tour.', [{ type: 'ADD_NEXT_TURN_DRAW', amount: 2 }]);
export const WayOfTheTurtle = way('way_of_the_turtle', 'Voie de la tortue', 'Mettez cette carte de côté. Si vous le faites, jouez-la au début de votre prochain tour.', [{ type: 'WAY_TURTLE' }]);
export const WayOfTheWorm = way('way_of_the_worm', 'Voie du ver', 'Exilez un Domaine de la réserve.', [{ type: 'EXILE_FROM_SUPPLY', cardId: 'estate' }]);
