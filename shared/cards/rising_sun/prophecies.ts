import { CardDefinition } from '../../types/CardDefinition.js';

export const approaching_armies: CardDefinition = {
    id: 'approaching_armies',
    name: 'Armées en Approche',
    cost: 0,
    types: ['PROPHECY'],
    description: "Accomplissement : Après avoir joué une carte Attaque, +1 💰. Trigger : Après avoir joué une carte Attaque, retirez un Jeton Soleil.",
    prophecyTrigger: { event: 'PLAY_CARD', filter: { cardTypes: ['ATTACK'] } },
    fulfillmentEffects: [{ type: 'REGISTER_TRIGGER', trigger: 'ON_PLAY', duration: 'PERMANENT', filter: { cardTypes: ['ATTACK'] }, effects: [{ type: 'ADD_MONEY', amount: 1 }] } as any],
    expansion: 'rising_sun'
};

export const biding_time: CardDefinition = {
    id: 'biding_time',
    name: 'Attendre son Heure',
    cost: 0,
    types: ['PROPHECY'],
    description: "Accomplissement : Au début de votre phase de Nettoyage, mettez votre main de côté face cachée. Au début de votre prochain tour, reprenez ces cartes en main. Trigger : Quand vous jouez une carte coûtant 5 💰 ou plus, retirez un Jeton Soleil.",
    prophecyTrigger: { event: 'PLAY_CARD', filter: { minCost: 5 } },
    fulfillmentEffects: [{ type: 'REGISTER_TRIGGER', trigger: 'ON_CLEANUP', duration: 'PERMANENT', effects: [{ type: 'SET_ASIDE_LINKED', count: 99 }] } as any],
    expansion: 'rising_sun'
};

export const bureaucracy: CardDefinition = {
    id: 'bureaucracy_prophecy',
    name: 'Bureaucratie',
    cost: 0,
    types: ['PROPHECY'],
    description: "Accomplissement : Quand vous recevez une carte que vous n'avez pas payée, recevez un Cuivre. Trigger : Quand vous recevez une carte coûtant 5 💰 ou plus, retirez un Jeton Soleil.",
    prophecyTrigger: { event: 'GAIN_CARD', filter: { minCost: 5 } },
    fulfillmentEffects: [{ type: 'REGISTER_TRIGGER', trigger: 'ON_GAIN', duration: 'PERMANENT', filter: { isFree: true } as any, effects: [{ type: 'GAIN_CARD', cardId: 'copper' }] } as any],
    expansion: 'rising_sun'
};

export const divine_wind: CardDefinition = {
    id: 'divine_wind',
    name: 'Vent Divin',
    cost: 0,
    types: ['PROPHECY'],
    description: "Accomplissement (Unique) : Quand vous retirez le dernier Jeton Soleil, retirez toutes les piles de cartes Royaume de la Réserve et installez 10 nouvelles piles aléatoires. Trigger : Quand vous jouez un Omen, retirez un Jeton Soleil.",
    fulfillmentEffects: [{ type: 'DIVINE_WIND_EFFECT' as any }],
    expansion: 'rising_sun'
};

export const enlightenment: CardDefinition = {
    id: 'enlightenment',
    name: 'Illumination',
    cost: 0,
    types: ['PROPHECY'],
    description: "Accomplissement : Les Trésors sont aussi des Actions. Quand vous jouez un Trésor pendant une phase d'Action, au lieu de suivre ses instructions, +1 Carte et +1 Action. Trigger : Quand vous jouez un Omen, retirez un Jeton Soleil.",
    fulfillmentEffects: [{ type: 'ENLIGHTENMENT_EFFECT' as any }],
    expansion: 'rising_sun'
};

export const flourishing_trade: CardDefinition = {
    id: 'flourishing_trade',
    name: 'Commerce Florissant',
    cost: 0,
    types: ['PROPHECY'],
    description: "Accomplissement : Les cartes coûtent 1 💰 de moins. Vous pouvez utiliser vos jeux d'Action comme des Achats. Trigger : Quand vous recevez une carte coûtant 3 💰 ou plus, retirez un Jeton Soleil.",
    prophecyTrigger: { event: 'GAIN_CARD', filter: { minCost: 3 } },
    fulfillmentEffects: [{ type: 'FLOURISHING_TRADE_EFFECT' as any }],
    expansion: 'rising_sun'
};

export const good_harvest: CardDefinition = {
    id: 'good_harvest',
    name: 'Bonne Récolte',
    cost: 0,
    types: ['PROPHECY'],
    description: "Accomplissement : La première fois que vous jouez chaque Trésor de nom différent chaque tour, d'abord +1 Achat. Trigger : La première fois que vous jouez chaque Trésor de nom différent chaque tour, d'abord retirez un Jeton Soleil.",
    prophecyTrigger: { event: 'PLAY_CARD', filter: { cardTypes: ['TREASURE'], uniqueEachTurn: true } as any },
    fulfillmentEffects: [{ type: 'REGISTER_TRIGGER', trigger: 'ON_PLAY', duration: 'PERMANENT', filter: { cardTypes: ['TREASURE'], uniqueEachTurn: true } as any, effects: [{ type: 'ADD_BUYS', amount: 1 }] } as any],
    expansion: 'rising_sun'
};

export const great_leader: CardDefinition = {
    id: 'great_leader',
    name: 'Grand Chef',
    cost: 0,
    types: ['PROPHECY'],
    description: "Accomplissement : Après chaque Action jouée, +1 Action. Trigger : Quand vous jouez un Omen, retirez un Jeton Soleil.",
    fulfillmentEffects: [{ type: 'REGISTER_TRIGGER', trigger: 'ON_PLAY', duration: 'PERMANENT', filter: { cardTypes: ['ACTION'] }, effects: [{ type: 'ADD_ACTIONS', amount: 1 }] } as any],
    expansion: 'rising_sun'
};

export const growth: CardDefinition = {
    id: 'growth',
    name: 'Croissance',
    cost: 0,
    types: ['PROPHECY'],
    description: "Accomplissement : Quand vous recevez un Trésor, recevez une carte moins chère. Trigger : Quand vous jouez un Omen, retirez un Jeton Soleil.",
    fulfillmentEffects: [{ type: 'REGISTER_TRIGGER', trigger: 'ON_GAIN', duration: 'PERMANENT', filter: { cardTypes: ['TREASURE'] } as any, effects: [{ type: 'GAIN_CARD', maxCost: -1, relativeToCost: 'GAINED' } as any] } as any],
    expansion: 'rising_sun'
};

export const harsh_winter: CardDefinition = {
    id: 'harsh_winter',
    name: 'Hiver Rigoureux',
    cost: 0,
    types: ['PROPHECY'],
    description: "Accomplissement : Quand vous recevez une carte pendant votre tour, s'il y a de la Dette sur sa pile, prenez-la ; sinon les autres joueurs mettent 2 Dette sur sa pile. Trigger : Quand vous recevez une carte pendant votre tour, d'abord retirez un Jeton Soleil.",
    prophecyTrigger: { event: 'GAIN_CARD' },
    fulfillmentEffects: [{ type: 'HARSH_WINTER_EFFECT' as any }],
    expansion: 'rising_sun'
};

export const kind_emperor: CardDefinition = {
    id: 'kind_emperor',
    name: 'Empereur Clément',
    cost: 0,
    types: ['PROPHECY'],
    description: "Accomplissement : Au début de votre tour (et quand vous accomplissez cette prophétie), recevez une carte Action de la Réserve en main. Trigger : Quand vous jouez un Omen, retirez un Jeton Soleil.",
    fulfillmentEffects: [{ type: 'KIND_EMPEROR_EFFECT' as any }],
    expansion: 'rising_sun'
};

export const panic: CardDefinition = {
    id: 'panic',
    name: 'Panique',
    cost: 0,
    types: ['PROPHECY'],
    description: "Accomplissement : Quand vous jouez un Trésor, +2 Achats. Quand vous en défaussez un du jeu, remettez-le dans sa pile. Trigger : Quand vous recevez une carte Victoire, retirez un Jeton Soleil.",
    prophecyTrigger: { event: 'GAIN_CARD', filter: { cardTypes: ['VICTORY'] } },
    fulfillmentEffects: [{ type: 'PANIC_EFFECT' as any }],
    expansion: 'rising_sun'
};

export const progress: CardDefinition = {
    id: 'progress',
    name: 'Progrès',
    cost: 0,
    types: ['PROPHECY'],
    description: "Accomplissement : Quand vous recevez une carte, mettez-la sur votre pioche. Trigger : Quand vous recevez une carte coûtant 5 💰 ou plus, retirez un Jeton Soleil.",
    prophecyTrigger: { event: 'GAIN_CARD', filter: { minCost: 5 } },
    fulfillmentEffects: [{ type: 'REGISTER_TRIGGER', trigger: 'ON_GAIN', duration: 'PERMANENT', effects: [{ type: 'MOVE_GAINED_TO_HAND' as any, destination: 'deck' } as any] } as any],
    expansion: 'rising_sun'
};

export const rapid_expansion: CardDefinition = {
    id: 'rapid_expansion',
    name: 'Expansion Rapide',
    cost: 0,
    types: ['PROPHECY'],
    description: "Accomplissement : Quand vous recevez une Action ou un Trésor, mettez-le de côté et jouez-le au début de votre prochain tour. Trigger : Quand vous recevez une carte coûtant 4 💰 ou plus, retirez un Jeton Soleil.",
    prophecyTrigger: { event: 'GAIN_CARD', filter: { minCost: 4 } },
    fulfillmentEffects: [{ type: 'RAPID_EXPANSION_EFFECT' as any }],
    expansion: 'rising_sun'
};

export const sickness: CardDefinition = {
    id: 'sickness',
    name: 'Maladie',
    cost: 0,
    types: ['PROPHECY'],
    description: "Accomplissement : Au début de votre tour, choisissez un : Recevez une Malédiction sur votre pioche, ou défaussez 3 cartes. Trigger : Au début de votre tour, retirez un Jeton Soleil.",
    prophecyTrigger: { event: 'TURN_START' },
    fulfillmentEffects: [{ type: 'REGISTER_TRIGGER', trigger: 'START_TURN', duration: 'PERMANENT', effects: [{ type: 'CHOOSE_OPTION', message: 'Maladie :', options: [{ label: 'Malédiction sur pioche', effects: [{ type: 'GAIN_CARD', cardId: 'curse', destination: 'deck' }] }, { label: 'Défausser 3 cartes', effects: [{ type: 'DISCARD', amount: 3 }] }] }] } as any],
    expansion: 'rising_sun'
};
