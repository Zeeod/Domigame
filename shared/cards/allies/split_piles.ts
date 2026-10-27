import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Allies — the cards of the 6 split piles (official texts): Augurs, Clashes, Forts, Odysseys,
 * Townsfolk, Wizards. Rules: engine/expansions/AlliesRules.ts.
 */
const s = (id: string, name: string, cost: number, types: string[], description: string, effects: any[], extra: any = {}): CardDefinition => ({
    id, name, cost, types, expansion: 'allies', description, effects, isSubCard: true, ...extra
} as any);
const rotate = (pile: string, label: string) => ({ type: 'CHOOSE_OPTION', message: `Retourner les ${label} ?`, options: [
    { label: 'Oui', effects: [{ type: 'ROTATE_PILE', pileId: pile }] }, { label: 'Non', effects: [] }] });

// ---------------------------------------------------------------- Augurs
export const herb_gatherer = s('herb_gatherer', 'Cueilleuse d\'herbes', 3, ['ACTION', 'AUGUR'],
    '+1 Achat. Placez votre pioche dans votre défausse. Regardez votre défausse ; vous pouvez y jouer un Trésor. Vous pouvez retourner les Augures.',
    [{ type: 'ADD_BUYS', amount: 1 }, { type: 'HERB_GATHERER' }, rotate('augurs_pile', 'Augures')]);
export const acolyte = s('acolyte', 'Acolyte', 4, ['ACTION', 'AUGUR'],
    'Vous pouvez écarter une carte Action ou Victoire de votre main pour recevoir un Or. Vous pouvez écarter cette carte pour recevoir un Augure.',
    [{ type: 'TRASH', min: 0, max: 1, from: 'hand', filter: { cardTypes: ['ACTION', 'VICTORY'] }, message: 'Acolyte : écarter une Action ou une Victoire pour un Or ?',
        onSuccess: [{ type: 'GAIN_CARD', cardId: 'gold' }] }, { type: 'ACOLYTE_SELF' }]);
export const sorceress = s('sorceress', 'Enchanteresse', 5, ['ACTION', 'ATTACK', 'AUGUR'],
    '+1 Action. Nommez une carte. Dévoilez la carte du dessus de votre pioche et prenez-la en main. Si c\'est la carte nommée, chaque autre joueur reçoit une Malédiction.',
    [{ type: 'ADD_ACTIONS', amount: 1 }, { type: 'NAME_CARD', message: 'Enchanteresse : nommez une carte', next: [{ type: 'SORCERESS' }] }]);
export const sibyl = s('sibyl', 'Sibylle', 6, ['ACTION', 'AUGUR'],
    '+4 Cartes, +1 Action. Placez une carte de votre main sur votre pioche, et une autre sous votre pioche.',
    [{ type: 'DRAW', amount: 4 }, { type: 'ADD_ACTIONS', amount: 1 }, { type: 'SIBYL' }]);

// ---------------------------------------------------------------- Clashes
export const battle_plan = s('battle_plan', 'Plan de bataille', 3, ['ACTION', 'CLASH'],
    '+1 Carte, +1 Action. Vous pouvez dévoiler une carte Attaque de votre main pour +1 Carte. Vous pouvez retourner une pile de la réserve.',
    [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 }, { type: 'BATTLE_PLAN' }]);
export const archer = s('archer', 'Archer', 4, ['ACTION', 'ATTACK', 'CLASH'],
    '+2 💰. Chaque autre joueur ayant 5 cartes ou plus en main les dévoile toutes sauf une, et défausse l\'une des cartes dévoilées, de votre choix.',
    [{ type: 'ADD_MONEY', amount: 2 }, { type: 'ATTACK', attackEffects: [{ type: 'ARCHER_HIT' }] }]);
export const warlord = s('warlord', 'Seigneur de guerre', 5, ['ACTION', 'DURATION', 'ATTACK', 'CLASH'],
    '+1 Action. Au début de votre prochain tour, +2 Cartes. D\'ici là, les autres joueurs ne peuvent pas jouer une carte Action de leur main s\'ils en ont 2 exemplaires ou plus en jeu.',
    [{ type: 'ADD_ACTIONS', amount: 1 }, { type: 'ATTACK', attackEffects: [{ type: 'WARLORD_HIT' }] }],
    { durationEffects: [{ type: 'WARLORD_END' }, { type: 'DRAW', amount: 2 }] });
export const territory = s('territory', 'Territoire', 6, ['VICTORY', 'CLASH'],
    '1 PV par carte Victoire de nom différent que vous avez. Quand vous recevez cette carte, recevez un Or par pile vide de la réserve.',
    [], {
        onGain: [{ type: 'TERRITORY_GOLDS' }],
        vpCalculator: (all: { id: string }[], get: (id: string) => any) => new Set(all.filter(c => get(c.id)?.types?.includes('VICTORY')).map(c => c.id)).size
    });

// ---------------------------------------------------------------- Forts
export const tent = s('tent', 'Tente', 3, ['ACTION', 'FORT'],
    '+2 💰. Vous pouvez retourner les Forts. Quand vous défaussez cette carte du jeu, vous pouvez la placer sur votre pioche.',
    [{ type: 'ADD_MONEY', amount: 2 }, rotate('forts_pile', 'Forts')], { topdeckWhenDiscarded: true });
export const garrison = s('garrison', 'Garnison', 4, ['ACTION', 'DURATION', 'FORT'],
    '+2 💰. Ce tour-ci, quand vous recevez une carte, ajoutez un jeton ici. Au début de votre prochain tour, retirez-les pour +1 Carte par jeton.',
    [{ type: 'ADD_MONEY', amount: 2 }, { type: 'GARRISON' }], { durationEffects: [{ type: 'GARRISON_DRAW' }] });
export const hill_fort = s('hill_fort', 'Fort de colline', 5, ['ACTION', 'FORT'],
    'Recevez une carte coûtant jusqu\'à 4 💰. Choisissez : prenez-la en main ; ou +1 Carte et +1 Action.',
    [{ type: 'GAIN_CARD', maxCost: 4, message: 'Fort de colline : recevez une carte coûtant jusqu\'à 4 💰', next: [{ type: 'HILL_FORT' }] }]);
export const stronghold = s('stronghold', 'Forteresse', 6, ['ACTION', 'VICTORY', 'DURATION', 'FORT'],
    'Choisissez : +3 💰 ; ou au début de votre prochain tour, +3 Cartes. 2 PV.',
    [{ type: 'CHOOSE_OPTION', message: 'Forteresse : choisissez', options: [
        { label: '+3 💰', effects: [{ type: 'ADD_MONEY', amount: 3 }, { type: 'CANCEL_DURATION' }] },
        { label: 'Au prochain tour, +3 Cartes', effects: [] }
    ] }], { victoryPoints: 2, durationEffects: [{ type: 'DRAW', amount: 3 }] });

// ---------------------------------------------------------------- Odysseys
export const old_map = s('old_map', 'Vieille carte', 3, ['ACTION', 'ODYSSEY'],
    '+1 Carte, +1 Action. Défaussez une carte. +1 Carte. Vous pouvez retourner les Odyssées.',
    [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 }, { type: 'DISCARD', amount: 1, message: 'Vieille carte : défaussez une carte' },
        { type: 'DRAW', amount: 1 }, rotate('odysseys_pile', 'Odyssées')]);
export const voyage = s('voyage', 'Voyage', 4, ['ACTION', 'DURATION', 'ODYSSEY'],
    '+1 Action. Si le tour précédent n\'était pas le vôtre, jouez un tour supplémentaire après celui-ci, pendant lequel vous ne pouvez jouer que 3 cartes de votre main.',
    [{ type: 'ADD_ACTIONS', amount: 1 }, { type: 'SCHEDULE_EXTRA_TURN', turnType: 'VOYAGE', cardLimit: 3 }], { durationEffects: [] });
export const sunken_treasure = s('sunken_treasure', 'Trésor englouti', 5, ['TREASURE', 'ODYSSEY'],
    'Recevez une carte Action dont vous n\'avez pas d\'exemplaire en jeu.', [{ type: 'SUNKEN_TREASURE' }], { treasureValue: 0 });
export const distant_shore = s('distant_shore', 'Rive lointaine', 6, ['ACTION', 'VICTORY', 'ODYSSEY'],
    '+2 Cartes, +1 Action. Recevez un Domaine. 2 PV.',
    [{ type: 'DRAW', amount: 2 }, { type: 'ADD_ACTIONS', amount: 1 }, { type: 'GAIN_CARD', cardId: 'estate' }], { victoryPoints: 2 });

// ---------------------------------------------------------------- Townsfolk
export const town_crier = s('town_crier', 'Crieur public', 2, ['ACTION', 'TOWNSFOLK'],
    'Choisissez : +2 💰 ; ou recevez un Argent ; ou +1 Carte et +1 Action. Vous pouvez retourner les Citadins.',
    [{ type: 'CHOOSE_OPTION', message: 'Crieur public : choisissez', options: [
        { label: '+2 💰', effects: [{ type: 'ADD_MONEY', amount: 2 }] },
        { label: 'Recevoir un Argent', effects: [{ type: 'GAIN_CARD', cardId: 'silver' }] },
        { label: '+1 Carte et +1 Action', effects: [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 }] }
    ] }, rotate('townsfolk_pile', 'Citadins')]);
export const town_blacksmith = s('town_blacksmith', 'Forgeron', 3, ['ACTION', 'TOWNSFOLK'],
    'Choisissez : piochez jusqu\'à avoir 6 cartes en main ; ou +2 Cartes ; ou +1 Carte et +1 Action.',
    [{ type: 'CHOOSE_OPTION', message: 'Forgeron : choisissez', options: [
        { label: 'Piocher jusqu\'à 6 cartes en main', effects: [{ type: 'DRAW_UNTIL_HAND_SIZE', targetSize: 6 }] },
        { label: '+2 Cartes', effects: [{ type: 'DRAW', amount: 2 }] },
        { label: '+1 Carte et +1 Action', effects: [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 }] }
    ] }]);
export const miller = s('miller', 'Meunier', 4, ['ACTION', 'TOWNSFOLK'],
    '+1 Action. Regardez les 4 cartes du dessus de votre pioche. Prenez-en une en main et défaussez le reste.',
    [{ type: 'ADD_ACTIONS', amount: 1 }, { type: 'MILLER' }]);
export const elder = s('elder', 'Ancien', 5, ['ACTION', 'TOWNSFOLK'],
    '+2 💰. Vous pouvez jouer une carte Action de votre main. Si elle vous propose un choix de capacités ce tour-ci, vous pouvez choisir une option (différente) de plus.',
    [{ type: 'ADD_MONEY', amount: 2 }, { type: 'ELDER' }]);

// ---------------------------------------------------------------- Wizards
export const student = s('student', 'Étudiant', 3, ['ACTION', 'WIZARD', 'LIAISON'],
    '+1 Action. Vous pouvez retourner les Sorciers. Écartez une carte de votre main. Si c\'est un Trésor, +1 Faveur et placez cette carte sur votre pioche.',
    [{ type: 'ADD_ACTIONS', amount: 1 }, rotate('wizards_pile', 'Sorciers'),
        { type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Étudiant : écartez une carte', onSuccess: [{ type: 'STUDENT_AFTER' }] }, { type: 'LIAISON_PLAYED' }]);
export const conjurer = s('conjurer', 'Illusionniste', 4, ['ACTION', 'DURATION', 'WIZARD'],
    'Recevez une carte coûtant jusqu\'à 4 💰. Au début de votre prochain tour, prenez cette carte en main.',
    [{ type: 'GAIN_CARD', maxCost: 4, message: 'Illusionniste : recevez une carte coûtant jusqu\'à 4 💰' }], { durationEffects: [{ type: 'CONJURER_RETURN' }] });
export const sorcerer_wizard = s('sorcerer_wizard', 'Sorcier', 5, ['ACTION', 'ATTACK', 'WIZARD'],
    '+1 Carte, +1 Action. Chaque autre joueur nomme une carte, puis dévoile la carte du dessus de sa pioche. S\'il s\'est trompé, il reçoit une Malédiction.',
    [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 }, { type: 'ATTACK', attackEffects: [{ type: 'NAME_CARD', message: 'Sorcier : nommez la carte du dessus de votre pioche', next: [{ type: 'SORCERER_CHECK' }] }] }]);
export const lich = s('lich', 'Liche', 6, ['ACTION', 'WIZARD'],
    '+6 Cartes, +2 Actions. Passez un tour. Quand vous écartez cette carte, défaussez-la et recevez une carte moins chère depuis le rebut.',
    [{ type: 'DRAW', amount: 6 }, { type: 'ADD_ACTIONS', amount: 2 }, { type: 'SKIP_A_TURN' }], { onTrash: [{ type: 'LICH_TRASHED' }] });
