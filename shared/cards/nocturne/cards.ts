import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Nocturne — the Kingdom cards (official texts). Rules: engine/expansions/NocturneRules.ts.
 * Night cards follow their instructions like any card (`effects`).
 */
const k = (id: string, name: string, cost: number, types: string[], description: string, effects: any[], extra: any = {}): CardDefinition => ({
    id, name, cost, types, expansion: 'nocturne', description, effects, ...extra
} as any);

export const Bard = k('bard', 'Barde', 4, ['ACTION', 'FATE'], '+2 💰. Recevez une Faveur.',
    [{ type: 'ADD_MONEY', amount: 2 }, { type: 'RECEIVE_BOON' }]);
export const BlessedVillage = k('blessed_village', 'Village béni', 4, ['ACTION', 'FATE'],
    '+1 Carte, +2 Actions. Quand vous recevez cette carte, prenez une Faveur. Recevez-la maintenant ou au début de votre prochain tour.',
    [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 2 }], { onGain: [{ type: 'BLESSED_VILLAGE_ON_GAIN' }] });
export const Cemetery = k('cemetery', 'Cimetière', 4, ['VICTORY'], '2 PV. Quand vous recevez cette carte, écartez jusqu\'à 4 cartes de votre main. Héritage : Miroir hanté.',
    [], { victoryPoints: 2, heirloom: 'haunted_mirror', onGain: [{ type: 'TRASH', min: 0, max: 4, from: 'hand', message: 'Cimetière : vous pouvez écarter jusqu\'à 4 cartes' }] });
export const Changeling = k('changeling', 'Changelin', 3, ['NIGHT'],
    'Écartez cette carte. Recevez une copie d\'une carte que vous avez en jeu. Dans les parties utilisant cette carte, quand vous recevez une carte coûtant 3 💰 ou plus, vous pouvez l\'échanger contre un Changelin.',
    [{ type: 'CHANGELING' }]);
export const Cobbler = k('cobbler', 'Cordonnier', 5, ['NIGHT', 'DURATION'], 'Au début de votre prochain tour, recevez en main une carte coûtant jusqu\'à 4 💰.',
    [], { durationEffects: [{ type: 'GAIN_CARD', maxCost: 4, destination: 'hand', message: 'Cordonnier : recevez en main une carte coûtant jusqu\'à 4 💰' }] });
export const Conclave = k('conclave', 'Conclave', 4, ['ACTION'],
    '+2 💰. Vous pouvez jouer une carte Action de votre main dont vous n\'avez pas de copie en jeu. Si vous le faites, +1 Action.',
    [{ type: 'ADD_MONEY', amount: 2 }, { type: 'PLAY_UNIQUE_ACTION', bonusAction: true, message: 'Conclave : jouer une Action dont vous n\'avez pas de copie en jeu ?' }]);
export const Crypt = k('crypt', 'Crypte', 5, ['NIGHT', 'DURATION'],
    'Mettez de côté face cachée autant de Trésors non-Durée que vous voulez parmi ceux que vous avez en jeu. Tant qu\'il en reste, au début de chacun de vos tours, prenez-en un en main.',
    [{ type: 'CRYPT' }], { durationEffects: [{ type: 'CRYPT_RETURN' }], durationTurns: 99 });
export const CursedVillage = k('cursed_village', 'Village maudit', 5, ['ACTION', 'DOOM'],
    '+2 Actions. Piochez jusqu\'à avoir 6 cartes en main. Quand vous recevez cette carte, recevez un Maléfice.',
    [{ type: 'ADD_ACTIONS', amount: 2 }, { type: 'DRAW_UNTIL_HAND_SIZE', targetSize: 6 }], { onGain: [{ type: 'RECEIVE_HEX' }] });
export const DenOfSin = k('den_of_sin', 'Antre du vice', 5, ['NIGHT', 'DURATION'], 'Au début de votre prochain tour, +2 Cartes. Cette carte est reçue en main (au lieu de votre défausse).',
    [], { durationEffects: [{ type: 'DRAW', amount: 2 }], gainToHand: true });
export const DevilsWorkshop = k('devils_workshop', 'Atelier du diable', 4, ['NIGHT'],
    'Si le nombre de cartes que vous avez reçues ce tour-ci est 2 ou plus, recevez un Diablotin ; 1, recevez une carte coûtant jusqu\'à 4 💰 ; 0, recevez un Or.',
    [{ type: 'DEVILS_WORKSHOP' }]);
export const Druid = k('druid', 'Druide', 2, ['ACTION', 'FATE'], '+1 Achat. Recevez l\'une des Faveurs mises de côté (laissez-la en place). Mise en place : mettez de côté face visible les 3 premières Faveurs.',
    [{ type: 'ADD_BUYS', amount: 1 }, { type: 'DRUID_CHOOSE_BOON' }]);
export const Exorcist = k('exorcist', 'Exorciste', 4, ['NIGHT'], 'Écartez une carte de votre main. Recevez un Esprit moins cher d\'une des piles d\'Esprits.',
    [{ type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Exorciste : écartez une carte', onSuccess: [{ type: 'EXORCIST_GAIN' }] }]);
export const FaithfulHound = k('faithful_hound', 'Chien fidèle', 2, ['ACTION', 'REACTION'],
    '+2 Cartes. Quand vous défaussez cette carte hors Ajustement, vous pouvez la mettre de côté et la prendre en main à la fin du tour.',
    [{ type: 'DRAW', amount: 2 }], { onDiscardOutsideCleanup: [{ type: 'FAITHFUL_HOUND' }] });
export const Fool = k('fool', 'Fou', 3, ['ACTION', 'FATE'],
    'Si vous n\'êtes pas le joueur qui a Perdu dans les bois, prenez-le, prenez 3 Faveurs et recevez-les dans l\'ordre de votre choix. Héritage : Pièce porte-bonheur.',
    [{ type: 'FOOL' }], { heirloom: 'lucky_coin' });
export const GhostTown = k('ghost_town', 'Ville fantôme', 3, ['NIGHT', 'DURATION'], 'Au début de votre prochain tour, +1 Carte et +1 Action. Cette carte est reçue en main (au lieu de votre défausse).',
    [], { durationEffects: [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 }], gainToHand: true });
export const Guardian = k('guardian', 'Gardien', 2, ['NIGHT', 'DURATION'],
    'Jusqu\'à votre prochain tour, quand un autre joueur joue une carte Attaque, elle ne vous affecte pas. Au début de votre prochain tour, +1 💰. Cette carte est reçue en main.',
    [], { durationEffects: [{ type: 'ADD_MONEY', amount: 1 }], gainToHand: true, blocksAttack: true });
export const Idol = k('idol', 'Idole', 5, ['TREASURE', 'ATTACK', 'FATE'],
    '2 💰. Quand vous jouez cette carte, si vous avez alors un nombre impair d\'Idoles en jeu, recevez une Faveur ; si c\'est un nombre pair, chaque autre joueur reçoit une Malédiction.',
    [{ type: 'ADD_MONEY', amount: 2 }, { type: 'IDOL' }], { treasureValue: 0 });
export const Leprechaun = k('leprechaun', 'Farfadet', 3, ['ACTION', 'DOOM'],
    'Recevez un Or. Si vous avez exactement 7 cartes en jeu, recevez un Vœu de sa pile. Sinon, recevez un Maléfice.',
    [{ type: 'GAIN_CARD', cardId: 'gold' }, { type: 'LEPRECHAUN' }]);
export const Monastery = k('monastery', 'Monastère', 2, ['NIGHT'],
    'Pour chaque carte que vous avez reçue ce tour-ci, vous pouvez écarter une carte de votre main ou un Cuivre que vous avez en jeu.', [{ type: 'MONASTERY' }]);
export const Necromancer = k('necromancer', 'Nécromancien', 4, ['ACTION'],
    'Jouez une carte Action non-Durée face visible du rebut, en l\'y laissant et en la retournant face cachée pour ce tour. Mise en place : placez les 3 Zombies dans le rebut.',
    [{ type: 'NECROMANCER' }]);
export const NightWatchman = k('night_watchman', 'Veilleur de nuit', 3, ['NIGHT'],
    'Regardez les 5 cartes du dessus de votre pioche, défaussez-en autant que vous voulez et remettez les autres dans l\'ordre de votre choix. Cette carte est reçue en main.',
    [{ type: 'NIGHT_WATCHMAN' }], { gainToHand: true });
export const Pixie = k('pixie', 'Lutin', 2, ['ACTION', 'FATE'],
    '+1 Carte, +1 Action. Défaussez la Faveur du dessus. Vous pouvez écarter cette carte pour recevoir deux fois cette Faveur. Héritage : Chèvre.',
    [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 }, { type: 'PIXIE' }], { heirloom: 'goat' });
export const Pooka = k('pooka', 'Pooka', 5, ['ACTION'],
    'Vous pouvez écarter un Trésor autre qu\'un Or maudit de votre main pour +4 Cartes. Héritage : Or maudit.',
    [{ type: 'TRASH', min: 0, max: 1, from: 'hand', filter: { cardTypes: ['TREASURE'], excludeIds: ['cursed_gold'] }, message: 'Pooka : écarter un Trésor pour +4 Cartes ?', ifTrashed: { count: 1, effects: [{ type: 'DRAW', amount: 4 }] } }],
    { heirloom: 'cursed_gold' });
export const Raider = k('raider', 'Pillard', 6, ['NIGHT', 'DURATION', 'ATTACK'],
    'Chaque autre joueur ayant 5 cartes ou plus en main défausse une copie d\'une carte que vous avez en jeu (ou dévoile qu\'il ne peut pas). Au début de votre prochain tour, +3 💰.',
    [{ type: 'ATTACK', attackEffects: [{ type: 'RAIDER_HIT' }] }], { durationEffects: [{ type: 'ADD_MONEY', amount: 3 }] });
export const SacredGrove = k('sacred_grove', 'Bosquet sacré', 5, ['ACTION', 'FATE'],
    '+1 Achat, +3 💰. Recevez une Faveur. Si elle ne donne pas +1 💰, chaque autre joueur peut la recevoir.',
    [{ type: 'ADD_BUYS', amount: 1 }, { type: 'ADD_MONEY', amount: 3 }, { type: 'SACRED_GROVE' }]);
export const SecretCave = k('secret_cave', 'Grotte secrète', 3, ['ACTION', 'DURATION'],
    '+1 Carte, +1 Action. Vous pouvez défausser 3 cartes. Si vous le faites, au début de votre prochain tour, +3 💰. Héritage : Lampe magique.',
    [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 }, { type: 'SECRET_CAVE' }],
    { durationEffects: [{ type: 'ADD_MONEY', amount: 3 }], heirloom: 'magic_lamp' });
export const Shepherd = k('shepherd', 'Berger', 4, ['ACTION'],
    '+1 Action. Défaussez autant de cartes Victoire que vous voulez, en les dévoilant. +2 Cartes par carte défaussée. Héritage : Pâturage.',
    [{ type: 'ADD_ACTIONS', amount: 1 }, { type: 'ARTIFICER_START' },
        { type: 'DISCARD', min: 0, max: 99, filter: { cardTypes: ['VICTORY'] }, message: 'Berger : défaussez des cartes Victoire (+2 Cartes chacune)' },
        { type: 'SHEPHERD_DRAW' }], { heirloom: 'pasture' });
export const Skulk = k('skulk', 'Rôdeur', 4, ['ACTION', 'ATTACK', 'DOOM'],
    '+1 Achat. Chaque autre joueur reçoit le prochain Maléfice. Quand vous recevez cette carte, recevez un Or.',
    [{ type: 'ADD_BUYS', amount: 1 }, { type: 'HEX_OTHERS' }], { onGain: [{ type: 'GAIN_CARD', cardId: 'gold' }] });
export const Tormentor = k('tormentor', 'Tourmenteur', 5, ['ACTION', 'ATTACK', 'DOOM'],
    '+2 💰. Si vous n\'avez pas d\'autres cartes en jeu, recevez un Diablotin de sa pile. Sinon, chaque autre joueur reçoit le prochain Maléfice.',
    [{ type: 'ADD_MONEY', amount: 2 }, { type: 'TORMENTOR' }]);
export const Tracker = k('tracker', 'Traqueur', 2, ['ACTION', 'FATE'],
    '+1 💰. Recevez une Faveur. Ce tour-ci, quand vous recevez une carte, vous pouvez la placer sur votre pioche. Héritage : Bourse.',
    [{ type: 'ADD_MONEY', amount: 1 },
        { type: 'REGISTER_TRIGGER', trigger: 'ON_GAIN', duration: 'TURN', repeat: true, description: 'Traqueur',
            effects: [{ type: 'SELECT_OPTION', message: 'Traqueur : placer la carte reçue sur votre pioche ?', options: [
                { label: 'Oui', effects: [{ type: 'GAINED_CARD_TO', to: 'deck' }] }, { label: 'Non', effects: [] }] }] },
        { type: 'RECEIVE_BOON' }], { heirloom: 'pouch' });
export const TragicHero = k('tragic_hero', 'Héros tragique', 5, ['ACTION'],
    '+3 Cartes, +1 Achat. Si vous avez 8 cartes ou plus en main (après la pioche), écartez cette carte et recevez un Trésor.',
    [{ type: 'DRAW', amount: 3 }, { type: 'ADD_BUYS', amount: 1 }, { type: 'TRAGIC_HERO' }]);
export const Vampire = k('vampire', 'Vampire', 5, ['NIGHT', 'ATTACK', 'DOOM'],
    'Chaque autre joueur reçoit le prochain Maléfice. Recevez une carte coûtant jusqu\'à 5 💰 autre qu\'un Vampire. Échangez cette carte contre une Chauve-souris.',
    [{ type: 'VAMPIRE' }]);
export const Werewolf = k('werewolf', 'Loup-garou', 5, ['ACTION', 'NIGHT', 'ATTACK', 'DOOM'],
    'Si c\'est votre phase de Nuit, chaque autre joueur reçoit le prochain Maléfice. Sinon, +3 Cartes.', [{ type: 'WEREWOLF' }]);
