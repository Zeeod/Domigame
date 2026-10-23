import { LandscapeDefinition } from '../../types/LandscapeDefinition';

/**
 * Adventures — the 20 Events (official texts). Effects not generic are in expansions/Adventures.ts.
 */
const ev = (id: string, name: string, coin: number, description: string, onBuy: any[], extra: Record<string, any> = {}): LandscapeDefinition => ({
    id, name, types: ['EVENT'], cost: { coin }, description, expansion: 'adventures', onBuy, ...extra
} as any);

export const alms = ev('alms', 'Aumône', 0,
    "Une fois par tour : si vous n'avez aucun Trésor en jeu, recevez une carte coûtant jusqu'à 4 💰.",
    [{ type: 'ALMS' }], { oncePerTurn: true });

export const borrow = ev('borrow', 'Emprunt', 0,
    'Une fois par tour : +1 Achat. Si votre jeton -1 Carte n\'est pas sur votre pioche, placez-le dessus et +1 💰.',
    [{ type: 'BORROW' }], { oncePerTurn: true });

export const quest = ev('quest', 'Quête', 0,
    'Vous pouvez défausser une Attaque, deux Malédictions ou six cartes. Si vous le faites, recevez un Or.',
    [{ type: 'QUEST' }]);

export const save = ev('save', 'Épargne', 1,
    'Une fois par tour : +1 Achat. Mettez de côté une carte de votre main, et prenez-la en main à la fin du tour (après avoir pioché).',
    [{ type: 'SAVE' }], { oncePerTurn: true });

export const scoutingParty = ev('scouting_party', 'Éclaireurs', 2,
    '+1 Achat. Regardez les 5 cartes du dessus de votre pioche. Défaussez-en 3 et remettez les autres dans l\'ordre de votre choix.',
    [{ type: 'SCOUTING_PARTY' }]);

export const travellingFair = ev('travelling_fair', 'Foire itinérante', 2,
    '+2 Achats. Quand vous recevez une carte ce tour-ci, vous pouvez la placer sur votre pioche.',
    [
        { type: 'ADD_BUYS', amount: 2 },
        {
            type: 'REGISTER_TRIGGER', trigger: 'ON_GAIN', duration: 'TURN', repeat: true,
            effects: [{ type: 'SELECT_OPTION', message: 'Foire itinérante : placer la carte reçue sur votre pioche ?', options: [
                { label: 'Oui', effects: [{ type: 'GAINED_CARD_TO', to: 'deck' }] },
                { label: 'Non', effects: [] }
            ] }],
            description: 'Foire itinérante'
        }
    ]);

export const bonfire = ev('bonfire', 'Feu de joie', 3, 'Écartez jusqu\'à 2 cartes que vous avez en jeu.', [{ type: 'BONFIRE' }]);

export const expedition = ev('expedition', 'Expédition', 3,
    'Piochez 2 cartes de plus pour votre prochaine main.', [{ type: 'ADD_NEXT_TURN_DRAW', amount: 2 }]);

export const ferry = ev('ferry', 'Bac', 3,
    'Déplacez votre jeton -2 💰 sur une pile Action de la réserve (les cartes de cette pile coûtent 2 💰 de moins pendant vos tours).',
    [{ type: 'MOVE_TOKEN', token: 'minus2Cost' }]);

export const plan = ev('plan', 'Plan', 3,
    'Déplacez votre jeton Écart sur une pile Action de la réserve (quand vous achetez une carte de cette pile, vous pouvez écarter une carte de votre main).',
    [{ type: 'MOVE_TOKEN', token: 'trashing' }]);

export const mission = ev('mission', 'Mission', 4,
    'Une fois par tour : si le tour précédent n\'était pas le vôtre, jouez un tour supplémentaire après celui-ci, pendant lequel vous ne pouvez pas acheter de cartes.',
    [{ type: 'SCHEDULE_EXTRA_TURN', turnType: 'MISSION' }], { oncePerTurn: true });

export const pilgrimage = ev('pilgrimage', 'Pèlerinage', 4,
    'Une fois par tour : retournez votre jeton Voyage (il commence face visible). Puis, s\'il est face visible, choisissez jusqu\'à 3 cartes de noms différents que vous avez en jeu et recevez-en une copie.',
    [{ type: 'PILGRIMAGE' }], { oncePerTurn: true });

export const ball = ev('ball', 'Bal', 5,
    'Prenez votre jeton -1 💰. Recevez 2 cartes coûtant chacune jusqu\'à 4 💰.',
    [{ type: 'TAKE_MINUS_COIN_TOKEN' }, { type: 'GAIN_CARD', maxCost: 4 }, { type: 'GAIN_CARD', maxCost: 4 }]);

export const raid = ev('raid', 'Raid', 5,
    'Recevez un Argent par Argent que vous avez en jeu. Chaque autre joueur place son jeton -1 Carte sur sa pioche.',
    [{ type: 'RAID' }]);

export const seaway = ev('seaway', 'Route maritime', 5,
    'Recevez une carte Action coûtant jusqu\'à 4 💰. Déplacez votre jeton +1 Achat sur sa pile.',
    [{ type: 'SEAWAY' }]);

export const trade = ev('trade', 'Commerce', 5,
    'Écartez jusqu\'à 2 cartes de votre main. Recevez un Argent par carte écartée.', [{ type: 'TRADE' }]);

export const lostArts = ev('lost_arts', 'Arts perdus', 6,
    'Déplacez votre jeton +1 Action sur une pile Action de la réserve.', [{ type: 'MOVE_TOKEN', token: 'plus1Action' }]);

export const training = ev('training', 'Entraînement', 6,
    'Déplacez votre jeton +1 💰 sur une pile Action de la réserve.', [{ type: 'MOVE_TOKEN', token: 'plus1Coin' }]);

export const inheritance = ev('inheritance', 'Héritage', 7,
    'Une fois par partie : mettez de côté une carte Action non-Victoire de la réserve coûtant jusqu\'à 4 💰. Placez-y votre jeton Domaine (pendant vos tours, vos Domaines sont aussi des Commandes et ont les capacités de cette carte).',
    [{ type: 'INHERITANCE' }], { oncePerGame: true });

export const pathfinding = ev('pathfinding', 'Orientation', 8,
    'Déplacez votre jeton +1 Carte sur une pile Action de la réserve.', [{ type: 'MOVE_TOKEN', token: 'plus1Card' }]);
