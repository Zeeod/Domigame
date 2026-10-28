import { CardDefinition } from '../../types/CardDefinition.js';

/** Nocturne — the 12 Hexes and the 5 States (official texts). */
const hex = (id: string, name: string, description: string, effects: any[]): CardDefinition => ({
    id, name, cost: 0, types: ['HEX'], expansion: 'nocturne', isNonSupply: true, description, effects
} as any);
const st = (id: string, name: string, description: string): CardDefinition => ({
    id, name, cost: 0, types: ['STATE'], expansion: 'nocturne', isNonSupply: true, description, effects: []
} as any);

export const BadOmens = hex('bad_omens', 'Mauvais présages', 'Placez votre pioche dans votre défausse. Regardez-la et placez-en 2 Cuivres sur votre pioche (ou dévoilez que vous ne pouvez pas).', [{ type: 'BAD_OMENS' }]);
export const Delusion = hex('delusion', 'Illusion', 'Si vous n\'avez ni Trompé ni Envieux, prenez Trompé.', [{ type: 'TAKE_STATE_IF_FREE', stateId: 'deluded' }]);
export const Envy = hex('envy', 'Envie', 'Si vous n\'avez ni Trompé ni Envieux, prenez Envieux.', [{ type: 'TAKE_STATE_IF_FREE', stateId: 'envious' }]);
export const Famine = hex('famine', 'Famine', 'Dévoilez les 3 cartes du dessus de votre pioche. Défaussez les Actions. Mélangez les autres dans votre pioche.', [{ type: 'FAMINE' }]);
export const Fear = hex('fear', 'Peur', 'Si vous avez au moins 5 cartes en main, défaussez une Action ou un Trésor (ou dévoilez que vous ne pouvez pas).', [{ type: 'FEAR' }]);
export const Greed = hex('greed', 'Cupidité', 'Recevez un Cuivre sur votre pioche.', [{ type: 'GAIN_CARD', cardId: 'copper', destination: 'deck' }]);
export const Haunting = hex('haunting', 'Hantise', 'Si vous avez au moins 4 cartes en main, placez-en une sur votre pioche.', [{ type: 'HAUNTING' }]);
export const Locusts = hex('locusts', 'Sauterelles', 'Écartez la carte du dessus de votre pioche. Si c\'est un Cuivre ou un Domaine, recevez une Malédiction. Sinon, recevez une carte moins chère partageant un type avec elle.', [{ type: 'LOCUSTS' }]);
export const Misery = hex('misery', 'Misère', 'Si c\'est votre première Misère de la partie, prenez Misérable. Sinon, retournez-le en Doublement misérable.', [{ type: 'MISERY' }]);
export const Plague = hex('plague', 'Peste', 'Recevez une Malédiction en main.', [{ type: 'GAIN_CARD', cardId: 'curse', destination: 'hand' }]);
export const Poverty = hex('poverty', 'Pauvreté', 'Défaussez jusqu\'à avoir 3 cartes en main.', [{ type: 'DISCARD_TO_HAND_SIZE', targetSize: 3 }]);
export const War = hex('war', 'Guerre', 'Dévoilez des cartes de votre pioche jusqu\'à dévoiler une carte coûtant 3 ou 4 💰. Écartez-la et défaussez le reste.', [{ type: 'WAR' }]);

export const ALL_HEXES = [BadOmens, Delusion, Envy, Famine, Fear, Greed, Haunting, Locusts, Misery, Plague, Poverty, War];

export const LostInTheWoods = st('lost_in_the_woods', 'Perdu dans les bois', 'Au début de votre tour, vous pouvez défausser une carte pour recevoir un Bienfait.');
export const Deluded = st('deluded', 'Trompé', 'Au début de votre phase Achat, rendez cet État : vous ne pouvez pas acheter de carte Action ce tour-ci.');
export const Envious = st('envious', 'Envieux', 'Au début de votre phase Achat, rendez cet État : l\'Argent et l\'Or rapportent 1 💰 ce tour-ci.');
export const Miserable = st('miserable', 'Misérable', '-2 PV.');
export const TwiceMiserable = st('twice_miserable', 'Doublement misérable', '-4 PV.');
