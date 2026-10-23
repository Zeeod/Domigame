import { CardDefinition } from '../../types/CardDefinition.js';

/** Nocturne — non-Supply cards: Spirits, Wish, Bat, Zombies. */
const ns = (id: string, name: string, cost: number, types: string[], description: string, effects: any[], extra: any = {}): CardDefinition => ({
    id, name, cost, types, expansion: 'nocturne', isNonSupply: true, isSubCard: true, description, effects, ...extra
} as any);

export const WillOWisp = ns('will_o_wisp', 'Feu follet', 0, ['ACTION', 'SPIRIT'],
    '+1 Carte, +1 Action. Dévoilez la carte du dessus de votre pioche. Si elle coûte 2 💰 ou moins, prenez-la en main. (Hors réserve.)',
    [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 }, { type: 'WILL_O_WISP' }]);
export const Imp = ns('imp', 'Diablotin', 2, ['ACTION', 'SPIRIT'],
    '+2 Cartes. Vous pouvez jouer une carte Action de votre main dont vous n\'avez pas de copie en jeu. (Hors réserve.)',
    [{ type: 'DRAW', amount: 2 }, { type: 'PLAY_UNIQUE_ACTION', message: 'Diablotin : jouer une Action dont vous n\'avez pas de copie en jeu ?' }]);
export const Ghost = ns('ghost', 'Fantôme', 4, ['NIGHT', 'DURATION', 'SPIRIT'],
    'Dévoilez des cartes de votre pioche jusqu\'à dévoiler une Action. Défaussez les autres et mettez l\'Action de côté. Au début de votre prochain tour, jouez-la deux fois. (Hors réserve.)',
    [{ type: 'GHOST' }], { durationEffects: [{ type: 'GHOST_PLAY' }] });
export const Wish = ns('wish', 'Vœu', 0, ['ACTION'],
    '+1 Action. Remettez cette carte sur sa pile. Si vous le faites, recevez en main une carte coûtant jusqu\'à 6 💰. (Hors réserve.)',
    [{ type: 'ADD_ACTIONS', amount: 1 }, { type: 'RETURN_TO_PILE' }, { type: 'WISH_GAIN' }]);
export const Bat = ns('bat', 'Chauve-souris', 2, ['NIGHT'],
    'Écartez jusqu\'à 2 cartes de votre main. Si vous en avez écarté au moins une, échangez cette carte contre un Vampire. (Hors réserve.)',
    [{ type: 'TRASH', min: 0, max: 2, from: 'hand', message: 'Chauve-souris : écartez jusqu\'à 2 cartes', ifTrashed: { count: 1, effects: [{ type: 'BAT_EXCHANGE' }] } }]);
export const ZombieApprentice = ns('zombie_apprentice', 'Apprenti zombie', 3, ['ACTION', 'ZOMBIE'],
    'Vous pouvez écarter une carte Action de votre main pour +3 Cartes et +1 Action.',
    [{ type: 'TRASH', min: 0, max: 1, from: 'hand', filter: { cardTypes: ['ACTION'] }, message: 'Apprenti zombie : écarter une Action pour +3 Cartes +1 Action ?', ifTrashed: { count: 1, effects: [{ type: 'DRAW', amount: 3 }, { type: 'ADD_ACTIONS', amount: 1 }] } }]);
export const ZombieMason = ns('zombie_mason', 'Maçon zombie', 3, ['ACTION', 'ZOMBIE'],
    'Écartez la carte du dessus de votre pioche. Vous pouvez recevoir une carte coûtant jusqu\'à 1 💰 de plus.', [{ type: 'ZOMBIE_MASON' }]);
export const ZombieSpy = ns('zombie_spy', 'Espion zombie', 3, ['ACTION', 'ZOMBIE'],
    '+1 Carte, +1 Action. Regardez la carte du dessus de votre pioche. Défaussez-la ou remettez-la.',
    [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 }, { type: 'ZOMBIE_SPY' }]);
