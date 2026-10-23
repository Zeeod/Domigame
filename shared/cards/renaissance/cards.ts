import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Renaissance — Kingdom cards, Artifacts and Projects (official texts).
 * Rules: engine/expansions/Renaissance.ts.
 */
const k = (id: string, name: string, cost: number, types: string[], description: string, effects: any[], extra: any = {}): CardDefinition => ({
    id, name, cost, types, expansion: 'renaissance', description, effects, ...extra
} as any);
const art = (id: string, name: string, description: string): CardDefinition => ({
    id, name, cost: 0, types: ['ARTIFACT'], expansion: 'renaissance', isNonSupply: true, description, effects: []
} as any);
const proj = (id: string, name: string, cost: number, description: string, extra: any = {}): CardDefinition => ({
    id, name, cost, types: ['PROJECT'], expansion: 'renaissance', description, effects: [], ...extra
} as any);

// ------------------------------------------------------------------------------------------ Kingdom
export const ActingTroupe = k('acting_troupe', 'Troupe de théâtre', 3, ['ACTION'], '+4 Villageois. Écartez cette carte.',
    [{ type: 'ADD_VILLAGERS', amount: 4 }, { type: 'TRASH_SELF' }]);
export const BorderGuard = k('border_guard', 'Garde-frontière', 2, ['ACTION'],
    '+1 Action. Dévoilez les 2 cartes du dessus de votre pioche. Prenez-en une en main et défaussez l\'autre. Si ce sont deux Actions, prenez la Lanterne ou le Cor.',
    [{ type: 'ADD_ACTIONS', amount: 1 }, { type: 'BORDER_GUARD' }]);
export const CargoShip = k('cargo_ship', 'Cargo', 3, ['ACTION', 'DURATION'],
    '+2 💰. Une fois ce tour-ci, quand vous recevez une carte, vous pouvez la mettre de côté face visible (sur cette carte). Au début de votre prochain tour, prenez-la en main.',
    [{ type: 'ADD_MONEY', amount: 2 }, { type: 'CARGO_SHIP' }], { durationEffects: [{ type: 'CARGO_SHIP_RETURN' }] });
export const Ducat = k('ducat', 'Ducat', 2, ['TREASURE'], '+1 Coffre, +1 Achat. Quand vous recevez cette carte, vous pouvez écarter un Cuivre de votre main.',
    [{ type: 'ADD_COFFERS', amount: 1 }, { type: 'ADD_BUYS', amount: 1 }],
    { onGain: [{ type: 'TRASH', min: 0, max: 1, from: 'hand', filter: { cardIds: ['copper'] }, message: 'Ducat : vous pouvez écarter un Cuivre' }] });
export const Experiment = k('experiment', 'Expérience', 3, ['ACTION'],
    '+2 Cartes, +1 Action. Remettez cette carte sur sa pile. Quand vous recevez cette carte, recevez une autre Expérience (qui n\'en amène pas d\'autre).',
    [{ type: 'DRAW', amount: 2 }, { type: 'ADD_ACTIONS', amount: 1 }, { type: 'RETURN_TO_PILE' }], { onGain: [{ type: 'EXPERIMENT_ON_GAIN' }] });
export const FlagBearer = k('flag_bearer', 'Porte-drapeau', 4, ['ACTION'], '+2 💰. Quand vous recevez ou écartez cette carte, prenez le Drapeau.',
    [{ type: 'ADD_MONEY', amount: 2 }], { onGain: [{ type: 'TAKE_ARTIFACT', artifact: 'flag' }], onTrash: [{ type: 'TAKE_ARTIFACT', artifact: 'flag' }] });
export const Hideout = k('hideout', 'Planque', 4, ['ACTION'], '+1 Carte, +2 Actions. Écartez une carte de votre main. Si c\'est une carte Victoire, recevez une Malédiction.',
    [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 2 },
        { type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Planque : écartez une carte', onSuccess: [{ type: 'HIDEOUT_CURSE' }] }]);
export const Improve = k('improve', 'Amélioration', 3, ['ACTION'],
    '+2 💰. Au début de l\'Ajustement, vous pouvez écarter une carte Action que vous défaussez du jeu ce tour-ci pour recevoir une carte coûtant exactement 1 💰 de plus.',
    [{ type: 'ADD_MONEY', amount: 2 }, { type: 'IMPROVE' }]);
export const Inventor = k('inventor', 'Inventeur', 4, ['ACTION'], 'Recevez une carte coûtant jusqu\'à 4 💰, puis les cartes coûtent 1 💰 de moins ce tour-ci.',
    [{ type: 'GAIN_CARD', maxCost: 4, next: [{ type: 'ADD_COST_REDUCTION', amount: 1 }], message: 'Inventeur : recevez une carte coûtant jusqu\'à 4 💰' }]);
export const Lackeys = k('lackeys', 'Laquais', 2, ['ACTION'], '+2 Cartes. Quand vous recevez cette carte, +2 Villageois.',
    [{ type: 'DRAW', amount: 2 }], { onGain: [{ type: 'ADD_VILLAGERS', amount: 2 }] });
export const MountainVillage = k('mountain_village', 'Village de montagne', 4, ['ACTION'],
    '+2 Actions. Regardez votre défausse et prenez-en une carte en main ; si vous ne pouvez pas, +1 Carte.',
    [{ type: 'ADD_ACTIONS', amount: 2 }, { type: 'MOUNTAIN_VILLAGE' }]);
export const OldWitch = k('old_witch', 'Vieille sorcière', 5, ['ACTION', 'ATTACK'], '+3 Cartes. Chaque autre joueur reçoit une Malédiction et peut écarter une Malédiction de sa main.',
    [{ type: 'DRAW', amount: 3 }, { type: 'ATTACK', attackEffects: [{ type: 'GAIN_CARD', cardId: 'curse' },
        { type: 'TRASH', min: 0, max: 1, from: 'hand', filter: { cardIds: ['curse'] }, message: 'Vieille sorcière : vous pouvez écarter une Malédiction' }] }]);
export const Patron = k('patron', 'Mécène', 4, ['ACTION', 'REACTION'],
    '+1 Villageois, +2 💰. Quand quelque chose vous fait dévoiler cette carte (avec le mot « dévoiler »), +1 Coffre.',
    [{ type: 'ADD_VILLAGERS', amount: 1 }, { type: 'ADD_MONEY', amount: 2 }]);
export const Priest = k('priest', 'Prêtre', 4, ['ACTION'], '+2 💰. Écartez une carte de votre main. Pour le reste de ce tour, quand vous écartez une carte, +2 💰.',
    [{ type: 'ADD_MONEY', amount: 2 }, { type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Prêtre : écartez une carte' }, { type: 'PRIEST' }]);
export const Recruiter = k('recruiter', 'Recruteur', 5, ['ACTION'], '+2 Cartes. Écartez une carte de votre main. +1 Villageois par 💰 de son coût.',
    [{ type: 'DRAW', amount: 2 }, { type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Recruteur : écartez une carte', onSuccess: [{ type: 'RECRUITER_VILLAGERS' }] }]);
export const Research = k('research', 'Recherche', 4, ['ACTION', 'DURATION'],
    '+1 Action. Écartez une carte de votre main. Par 💰 de son coût, mettez de côté face cachée une carte de votre pioche. Au début de votre prochain tour, prenez ces cartes en main.',
    [{ type: 'ADD_ACTIONS', amount: 1 }, { type: 'RESEARCH_START' }],
    { durationEffects: [{ type: 'RESEARCH_RETURN' }] });
export const Scepter = k('scepter', 'Sceptre', 5, ['TREASURE'],
    'Choisissez : +2 💰 ; ou rejouez une carte Action non-Commande que vous avez jouée ce tour-ci et qui est encore en jeu.', [{ type: 'SCEPTER' }]);
export const Scholar = k('scholar', 'Érudit', 5, ['ACTION'], 'Défaussez votre main. +7 Cartes.',
    [{ type: 'DISCARD', forceAll: true }, { type: 'DRAW', amount: 7 }]);
export const Sculptor = k('sculptor', 'Sculpteur', 5, ['ACTION'], 'Recevez en main une carte coûtant jusqu\'à 4 💰. Si c\'est un Trésor, +1 Villageois.',
    [{ type: 'GAIN_CARD', maxCost: 4, destination: 'hand', next: [{ type: 'SCULPTOR_CHECK' }], message: 'Sculpteur : recevez en main une carte coûtant jusqu\'à 4 💰' }]);
export const Seer = k('seer', 'Voyant', 5, ['ACTION'],
    '+1 Carte, +1 Action. Dévoilez les 3 cartes du dessus de votre pioche. Prenez en main celles coûtant de 2 à 4 💰. Remettez les autres dans l\'ordre de votre choix.',
    [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 }, { type: 'SEER' }]);
export const SilkMerchant = k('silk_merchant', 'Marchand de soie', 4, ['ACTION'], '+2 Cartes, +1 Achat. Quand vous recevez ou écartez cette carte, +1 Coffre et +1 Villageois.',
    [{ type: 'DRAW', amount: 2 }, { type: 'ADD_BUYS', amount: 1 }],
    { onGain: [{ type: 'ADD_COFFERS', amount: 1 }, { type: 'ADD_VILLAGERS', amount: 1 }], onTrash: [{ type: 'ADD_COFFERS', amount: 1 }, { type: 'ADD_VILLAGERS', amount: 1 }] });
export const Spices = k('spices', 'Épices', 5, ['TREASURE'], '2 💰, +1 Achat. Quand vous recevez cette carte, +2 Coffres.',
    [{ type: 'ADD_MONEY', amount: 2 }, { type: 'ADD_BUYS', amount: 1 }], { onGain: [{ type: 'ADD_COFFERS', amount: 2 }] });
export const Swashbuckler = k('swashbuckler', 'Bretteur', 5, ['ACTION'],
    '+3 Cartes. Si votre défausse contient au moins une carte : +1 Coffre, puis si vous avez au moins 4 Coffres, prenez le Coffre au trésor.',
    [{ type: 'DRAW', amount: 3 }, { type: 'SWASHBUCKLER' }]);
export const Treasurer = k('treasurer', 'Trésorier', 5, ['ACTION'],
    '+3 💰. Choisissez : écartez un Trésor de votre main ; ou recevez en main un Trésor du rebut ; ou prenez la Clé.',
    [{ type: 'ADD_MONEY', amount: 3 }, { type: 'TREASURER' }]);
export const Villain = k('villain', 'Scélérat', 5, ['ACTION', 'ATTACK'],
    '+2 Coffres. Chaque autre joueur ayant 5 cartes ou plus en main en défausse une coûtant 2 💰 ou plus (ou dévoile qu\'il ne peut pas).',
    [{ type: 'ADD_COFFERS', amount: 2 }, { type: 'ATTACK', attackEffects: [{ type: 'VILLAIN_HIT' }] }]);

// ------------------------------------------------------------------------------------------ Artifacts
export const Flag = art('flag', 'Drapeau', 'Quand vous piochez votre main, +1 Carte.');
export const Horn = art('horn', 'Cor', 'Une fois par tour, quand vous défaussez un Garde-frontière du jeu, vous pouvez le placer sur votre pioche.');
export const Key = art('key', 'Clé', 'Au début de votre tour, +1 💰.');
export const Lantern = art('lantern', 'Lanterne', 'Vos Gardes-frontière dévoilent 3 cartes et en défaussent 2 (il faut 3 Actions pour prendre le Cor).');
export const TreasureChest = art('treasure_chest', 'Coffre au trésor', 'Au début de votre phase Achat, recevez un Or.');

// ------------------------------------------------------------------------------------------ Projects
export const Academy = proj('academy', 'Académie', 5, 'Quand vous recevez une carte Action, +1 Villageois.');
export const Barracks = proj('barracks', 'Caserne', 6, 'Au début de votre tour, +1 Action.', { onTurnStart: [{ type: 'ADD_ACTIONS', amount: 1 }] });
export const Canal = proj('canal', 'Canal', 7, 'Pendant vos tours, les cartes coûtent 1 💰 de moins.');
export const Capitalism = proj('capitalism', 'Capitalisme', 5, 'Pendant vos tours, les Actions ayant un montant en +💰 dans leur texte sont aussi des Trésors.', { onBuy: [{ type: 'CAPITALISM' }] });
export const Cathedral = proj('cathedral', 'Cathédrale', 3, 'Au début de votre tour, écartez une carte de votre main.',
    { onTurnStart: [{ type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Cathédrale : écartez une carte de votre main' }] });
export const Citadel = proj('citadel', 'Citadelle', 8, 'La première fois que vous jouez une carte Action pendant chacun de vos tours, rejouez-la ensuite.');
export const CityGate = proj('city_gate', 'Porte de la ville', 3, 'Au début de votre tour, +1 Carte, puis placez une carte de votre main sur votre pioche.',
    { onTurnStart: [{ type: 'DRAW', amount: 1 }, { type: 'CHOOSE_FROM_ZONE', sourceZone: 'hand', destination: 'deck', min: 1, max: 1, message: 'Porte de la ville : placez une carte sur votre pioche' }] });
export const CropRotation = proj('crop_rotation', 'Rotation des cultures', 6, 'Au début de votre tour, vous pouvez défausser une carte Victoire pour +2 Cartes.',
    { onTurnStart: [{ type: 'DISCARD', min: 0, max: 1, filter: { cardTypes: ['VICTORY'] }, message: 'Rotation des cultures : défausser une Victoire pour +2 Cartes ?', onSuccess: [{ type: 'DRAW', amount: 2 }] }] });
export const Exploration = proj('exploration', 'Exploration', 4, 'À la fin de votre phase Achat, si vous n\'avez acheté aucune carte pendant celle-ci, +1 Coffre et +1 Villageois.');
export const Fair = proj('fair', 'Foire', 4, 'Au début de votre tour, +1 Achat.', { onTurnStart: [{ type: 'ADD_BUYS', amount: 1 }] });
export const Fleet = proj('fleet', 'Flotte', 5, 'Après la fin de la partie, un tour supplémentaire est joué, uniquement par les joueurs ayant ce Projet.');
export const Guildhall = proj('guildhall', 'Hôtel de la guilde', 5, 'Quand vous recevez un Trésor, +1 Coffre.');
export const Innovation = proj('innovation', 'Innovation', 6, 'La première fois que vous recevez une carte Action pendant chacun de vos tours, vous pouvez la mettre de côté. Si vous le faites, jouez-la.');
export const Pageant = proj('pageant', 'Parade', 3, 'À la fin de votre phase Achat, vous pouvez payer 1 💰 pour +1 Coffre.');
export const Piazza = proj('piazza', 'Piazza', 5, 'Au début de votre tour, dévoilez la carte du dessus de votre pioche. Si c\'est une Action, jouez-la.', { onTurnStart: [{ type: 'PIAZZA' }] });
export const RoadNetwork = proj('road_network', 'Réseau routier', 5, 'Quand un autre joueur reçoit une carte Victoire, +1 Carte.');
export const Sewers = proj('sewers', 'Égouts', 3, 'Quand vous écartez une carte autrement qu\'avec les Égouts, vous pouvez écarter une carte de votre main.');
export const Silos = proj('silos', 'Silos', 4, 'Au début de votre tour, défaussez autant de Cuivres que vous voulez, en les dévoilant, et piochez autant de cartes.',
    { onTurnStart: [{ type: 'SILOS' }] });
export const SinisterPlot = proj('sinister_plot', 'Complot', 4, 'Au début de votre tour, ajoutez un jeton ici, ou retirez vos jetons d\'ici pour +1 Carte chacun.',
    { onTurnStart: [{ type: 'SINISTER_PLOT' }] });
export const StarChart = proj('star_chart', 'Carte du ciel', 3, 'Quand vous mélangez, vous pouvez choisir une des cartes pour la placer sur le dessus.');
