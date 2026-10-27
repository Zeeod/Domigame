import { CardDefinition } from '../../types/CardDefinition.js';

/** Menagerie — the 20 Events (official texts). */
const ev = (id: string, name: string, cost: number, description: string, effects: any[], extra: any = {}): CardDefinition => ({
    id, name, types: ['EVENT'], cost, description, expansion: 'menagerie', effects, ...extra
} as any);

export const Alliance = ev('alliance', 'Alliance', 10, 'Recevez une Province, un Duché, un Domaine, un Or, un Argent et un Cuivre.',
    ['province', 'duchy', 'estate', 'gold', 'silver', 'copper'].map(c => ({ type: 'GAIN_CARD', cardId: c })));
export const Banish = ev('banish', 'Bannissement', 4, 'Exilez autant de cartes de même nom de votre main que vous voulez.', [{ type: 'BANISH' }]);
export const Bargain = ev('bargain', 'Marchandage', 4, 'Recevez une carte non-Victoire coûtant jusqu\'à 5 💰. Chaque autre joueur reçoit un Cheval.',
    [{ type: 'GAIN_CARD', maxCost: 5, nonVictory: true, message: 'Marchandage : recevez une carte non-Victoire coûtant jusqu\'à 5 💰' }, { type: 'OTHERS_GAIN', cardId: 'horse' }]);
export const Commerce = ev('commerce', 'Commerce', 5, 'Recevez un Or par carte de nom différent que vous avez reçue ce tour-ci.', [{ type: 'COMMERCE' }]);
export const Delay = ev('delay', 'Retard', 0, 'Vous pouvez mettre de côté une carte Action de votre main. Au début de votre prochain tour, jouez-la.', [{ type: 'DELAY' }]);
export const Demand = ev('demand', 'Demande', 5, 'Recevez un Cheval et une carte coûtant jusqu\'à 4 💰, tous deux sur votre pioche.',
    [{ type: 'GAIN_CARD', cardId: 'horse', destination: 'deck' }, { type: 'GAIN_CARD', maxCost: 4, destination: 'deck', message: 'Demande : recevez une carte coûtant jusqu\'à 4 💰 (sur votre pioche)' }]);
export const Desperation = ev('desperation', 'Désespoir', 0, 'Une fois par tour : vous pouvez recevoir une Malédiction. Si vous le faites, +1 Achat et +2 💰.',
    [{ type: 'DESPERATION' }], { oncePerTurn: true });
export const Enclave = ev('enclave', 'Enclave', 8, 'Recevez un Or. Exilez un Duché de la réserve.', [{ type: 'GAIN_CARD', cardId: 'gold' }, { type: 'EXILE_FROM_SUPPLY', cardId: 'duchy' }]);
export const Enhance = ev('enhance', 'Amélioration', 3, 'Vous pouvez écarter une carte non-Victoire de votre main pour recevoir une carte coûtant jusqu\'à 2 💰 de plus.',
    [{ type: 'TRASH', min: 0, max: 1, from: 'hand', filter: { excludeTypes: ['VICTORY'] }, message: 'Amélioration : écarter une carte non-Victoire ?', ifTrashed: { count: 1, effects: [{ type: 'GAIN_CARD_PLUS_COST', costBonus: 2 }] } }]);
export const Gamble = ev('gamble', 'Pari', 2, '+1 Achat. Dévoilez la carte du dessus de votre pioche. Si c\'est un Trésor ou une Action, vous pouvez la jouer. Sinon, défaussez-la.',
    [{ type: 'ADD_BUYS', amount: 1 }, { type: 'GAMBLE' }]);
export const Invest = ev('invest', 'Investissement', 4, 'Exilez une carte Action de la réserve. Tant qu\'elle est en Exil, quand un autre joueur en reçoit une copie, +2 Cartes.',
    [{ type: 'EXILE_FROM_SUPPLY', filter: { cardTypes: ['ACTION'] }, invest: true }]);
export const March = ev('march', 'Marche', 3, 'Regardez votre défausse. Vous pouvez y jouer une carte Action.', [{ type: 'MARCH' }]);
export const Populate = ev('populate', 'Peuplement', 10, 'Recevez une carte de chaque pile Action de la réserve.', [{ type: 'POPULATE' }]);
export const Pursue = ev('pursue', 'Poursuite', 2, '+1 Achat. Nommez une carte. Dévoilez les 4 cartes du dessus de votre pioche. Remettez celles qui correspondent et défaussez le reste.',
    [{ type: 'ADD_BUYS', amount: 1 }, { type: 'NAME_CARD', message: 'Poursuite : nommez une carte', next: [{ type: 'PURSUE' }] }]);
export const Reap = ev('reap', 'Moisson', 7, 'Recevez un Or. Mettez-le de côté. Si vous le faites, au début de votre prochain tour, jouez-le.', [{ type: 'REAP' }]);
export const Ride = ev('ride', 'Chevauchée', 2, 'Recevez un Cheval.', [{ type: 'GAIN_CARD', cardId: 'horse' }]);
export const SeizeTheDay = ev('seize_the_day', 'Saisir le jour', 4, 'Une fois par partie : jouez un tour supplémentaire après celui-ci.',
    [{ type: 'SCHEDULE_EXTRA_TURN', turnType: 'EXTRA' }], { oncePerGame: true });
export const Stampede = ev('stampede', 'Ruée', 5, 'Si vous avez 5 cartes ou moins en jeu, recevez 5 Chevaux sur votre pioche.', [{ type: 'STAMPEDE' }]);
export const Toil = ev('toil', 'Labeur', 2, '+1 Achat. Vous pouvez jouer une carte Action de votre main.', [{ type: 'ADD_BUYS', amount: 1 }, { type: 'MAY_PLAY_FROM_HAND', filter: { cardTypes: ['ACTION'] }, message: 'Labeur : jouer une Action de votre main ?' }]);
export const Transport = ev('transport', 'Transport', 3, 'Choisissez : exilez une carte Action de la réserve ; ou placez sur votre pioche une carte Action que vous avez en Exil.', [{ type: 'TRANSPORT' }]);
