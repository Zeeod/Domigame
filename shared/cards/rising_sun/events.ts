import { CardDefinition } from '../../types/CardDefinition.js';

/** Rising Sun — the 10 Events (official texts). Rules: engine/expansions/RisingSunRules.ts. */
const ev = (id: string, name: string, cost: number, description: string, effects: any[], extra: any = {}): CardDefinition => ({
    id, name, types: ['EVENT'], cost, description, expansion: 'rising_sun', effects, ...extra
} as any);

export const amass = ev('amass', 'Amasser', 2, 'Si vous n\'avez aucune carte Action en jeu, recevez une carte Action coûtant jusqu\'à 5 💰.', [{ type: 'AMASS' }]);
export const asceticism = ev('asceticism', 'Ascétisme', 2, 'Payez autant de 💰 que vous voulez pour écarter autant de cartes de votre main.', [{ type: 'ASCETICISM' }]);
export const credit = ev('credit', 'Crédit', 2, 'Recevez une carte Action ou Trésor coûtant jusqu\'à 8 💰. Prenez autant de Dette que son coût.', [{ type: 'CREDIT' }]);
export const foresight = ev('foresight', 'Prévoyance', 2, 'Dévoilez des cartes de votre pioche jusqu\'à dévoiler une Action. Mettez-la de côté et défaussez le reste. Prenez-la en main à la fin du tour.',
    [{ type: 'FORESIGHT' }]);
export const kintsugi = ev('kintsugi', 'Kintsugi', 3, 'Écartez une carte de votre main. Si vous avez reçu un Or pendant cette partie, recevez une carte coûtant jusqu\'à 2 💰 de plus que la carte écartée.',
    [{ type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Kintsugi : écartez une carte', onSuccess: [{ type: 'KINTSUGI' }] }]);
export const practice = ev('practice', 'Entraînement', 3, 'Vous pouvez jouer deux fois une carte Action de votre main.', [{ type: 'PRACTICE' }]);
export const sea_trade = ev('sea_trade', 'Commerce maritime', 4, '+1 Carte par carte Action que vous avez en jeu. Écartez jusqu\'à autant de cartes de votre main.', [{ type: 'SEA_TRADE' }]);
export const receive_tribute = ev('receive_tribute', 'Recevoir le tribut', 5,
    'Si vous avez reçu au moins 3 cartes ce tour-ci, recevez jusqu\'à 3 cartes Action de noms différents dont vous n\'avez pas d\'exemplaire en jeu.', [{ type: 'RECEIVE_TRIBUTE' }]);
export const gather = ev('gather', 'Rassemblement', 7, 'Recevez une carte coûtant exactement 3 💰, une carte coûtant exactement 4 💰 et une carte coûtant exactement 5 💰.',
    [3, 4, 5].map(n => ({ type: 'GAIN_EXACT', cost: n })));
export const continue_event = ev('continue', 'Continuer', 8,
    'Une fois par tour : recevez une carte Action non-Attaque coûtant jusqu\'à 4 💰. Retournez à votre phase Action et jouez-la. +1 Action et +1 Achat.',
    [{ type: 'CONTINUE' }], { oncePerTurn: true });
