import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Allies — the 25 Kingdom cards that are not in a split pile (official texts).
 * Rules: engine/expansions/AlliesRules.ts. A Liaison ends with LIAISON_PLAYED ("after playing a Liaison").
 */
const k = (id: string, name: string, cost: number, types: string[], description: string, effects: any[], extra: any = {}): CardDefinition => ({
    id, name, cost, types, expansion: 'allies', description, effects, ...extra
} as any);
const LIAISON = { type: 'LIAISON_PLAYED' };

export const barbarian = k('barbarian', 'Barbare', 5, ['ACTION', 'ATTACK'],
    '+2 💰. Chaque autre joueur écarte la carte du dessus de sa pioche. Si elle coûte 3 💰 ou plus, il reçoit une carte moins chère ayant un type en commun avec elle ; sinon, il reçoit une Malédiction.',
    [{ type: 'ADD_MONEY', amount: 2 }, { type: 'ATTACK', attackEffects: [{ type: 'BARBARIAN_HIT' }] }]);
export const bauble = k('bauble', 'Babiole', 2, ['TREASURE', 'LIAISON'],
    'Choisissez deux options différentes : +1 Achat ; +1 💰 ; +1 Faveur ; ce tour-ci, quand vous recevez une carte, vous pouvez la placer sur votre pioche.',
    [{ type: 'CHOOSE_OPTION', message: 'Babiole : choisissez deux options différentes', min: 2, max: 2, options: [
        { label: '+1 Achat', effects: [{ type: 'ADD_BUYS', amount: 1 }] },
        { label: '+1 💰', effects: [{ type: 'ADD_MONEY', amount: 1 }] },
        { label: '+1 Faveur', effects: [{ type: 'ADD_FAVORS', amount: 1 }] },
        { label: 'Cartes reçues sur la pioche (ce tour-ci)', effects: [{ type: 'GAINS_MAY_TOPDECK', source: 'Babiole' }] }
    ] }, LIAISON], { treasureValue: 0 });
export const broker = k('broker', 'Courtier', 4, ['ACTION', 'LIAISON'],
    'Écartez une carte de votre main et choisissez : +1 Carte par 💰 de son coût ; ou +1 Action par 💰 ; ou +1 💰 par 💰 ; ou +1 Faveur par 💰.',
    [{ type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Courtier : écartez une carte', onSuccess: [{ type: 'BROKER_PICK' }] }, LIAISON]);
export const capital_city = k('capital_city', 'Capitale', 5, ['ACTION'],
    '+1 Carte, +2 Actions. Vous pouvez défausser 2 cartes pour +2 💰. Vous pouvez payer 2 💰 pour +2 Cartes.',
    [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 2 }, { type: 'CAPITAL_CITY' }]);
export const carpenter = k('carpenter', 'Charpentier', 4, ['ACTION'],
    'Si aucune pile de la réserve n\'est vide, +1 Action et recevez une carte coûtant jusqu\'à 4 💰. Sinon, écartez une carte de votre main et recevez une carte coûtant jusqu\'à 2 💰 de plus qu\'elle.',
    [{ type: 'CARPENTER' }]);
export const contract = k('contract', 'Contrat', 5, ['TREASURE', 'DURATION', 'LIAISON'],
    '2 💰. +1 Faveur. Vous pouvez mettre de côté une carte Action de votre main pour la jouer au début de votre prochain tour.',
    [{ type: 'ADD_MONEY', amount: 2 }, { type: 'ADD_FAVORS', amount: 1 }, { type: 'CONTRACT' }, LIAISON], { treasureValue: 0, durationEffects: [] });
export const courier = k('courier', 'Messager', 4, ['ACTION'],
    '+1 💰. Défaussez la carte du dessus de votre pioche. Regardez votre défausse ; vous pouvez y jouer une carte Action ou Trésor.',
    [{ type: 'ADD_MONEY', amount: 1 }, { type: 'COURIER' }]);
export const emissary = k('emissary', 'Émissaire', 5, ['ACTION', 'LIAISON'],
    '+3 Cartes. Si cela vous a fait mélanger (au moins une carte), +1 Action et +2 Faveurs.',
    [{ type: 'EMISSARY' }, LIAISON]);
export const galleria = k('galleria', 'Galerie', 5, ['ACTION'], '+3 💰. Ce tour-ci, quand vous recevez une carte coûtant 3 💰 ou 4 💰, +1 Achat.',
    [{ type: 'ADD_MONEY', amount: 3 }, { type: 'REGISTER_TRIGGER', trigger: 'ON_GAIN', duration: 'TURN', repeat: true, filter: { minCost: 3, maxCost: 4 },
        effects: [{ type: 'ADD_BUYS', amount: 1 }], description: 'Galerie' }]);
export const guildmaster = k('guildmaster', 'Maître de guilde', 5, ['ACTION', 'LIAISON'], '+3 💰. Ce tour-ci, quand vous recevez une carte, +1 Faveur.',
    [{ type: 'ADD_MONEY', amount: 3 }, { type: 'REGISTER_TRIGGER', trigger: 'ON_GAIN', duration: 'TURN', repeat: true,
        effects: [{ type: 'ADD_FAVORS', amount: 1 }], description: 'Maître de guilde' }, LIAISON]);
export const highwayman = k('highwayman', 'Bandit de grand chemin', 5, ['ACTION', 'DURATION', 'ATTACK'],
    'Au début de votre prochain tour, défaussez cette carte du jeu et +3 Cartes. D\'ici là, le premier Trésor que chaque autre joueur joue à chacun de ses tours ne fait rien.',
    [{ type: 'ATTACK', attackEffects: [{ type: 'HIGHWAYMAN_HIT' }] }], { durationEffects: [{ type: 'HIGHWAYMAN_END' }, { type: 'DRAW', amount: 3 }] });
export const hunter = k('hunter', 'Chasseur', 5, ['ACTION'],
    '+1 Action. Dévoilez les 3 cartes du dessus de votre pioche. Parmi elles, prenez en main une carte Action, une carte Trésor et une carte Victoire. Défaussez le reste.',
    [{ type: 'ADD_ACTIONS', amount: 1 }, { type: 'HUNTER' }]);
export const importer = k('importer', 'Importateur', 3, ['ACTION', 'DURATION'],
    'Au début de votre prochain tour, recevez une carte coûtant jusqu\'à 5 💰. Mise en place : chaque joueur reçoit +4 Faveurs.',
    [], { durationEffects: [{ type: 'GAIN_CARD', maxCost: 5, message: 'Importateur : recevez une carte coûtant jusqu\'à 5 💰' }] });
export const innkeeper = k('innkeeper', 'Aubergiste', 4, ['ACTION'],
    '+1 Action. Choisissez : +1 Carte ; ou +3 Cartes puis défaussez 3 cartes ; ou +5 Cartes puis défaussez 6 cartes.',
    [{ type: 'ADD_ACTIONS', amount: 1 }, { type: 'CHOOSE_OPTION', message: 'Aubergiste : choisissez', options: [
        { label: '+1 Carte', effects: [{ type: 'DRAW', amount: 1 }] },
        { label: '+3 Cartes, puis défaussez 3 cartes', effects: [{ type: 'DRAW', amount: 3 }, { type: 'DISCARD', amount: 3, message: 'Aubergiste : défaussez 3 cartes' }] },
        { label: '+5 Cartes, puis défaussez 6 cartes', effects: [{ type: 'DRAW', amount: 5 }, { type: 'DISCARD', amount: 6, message: 'Aubergiste : défaussez 6 cartes' }] }
    ] }]);
export const marquis = k('marquis', 'Marquis', 6, ['ACTION'],
    '+1 Achat. +1 Carte par carte dans votre main. Défaussez jusqu\'à avoir 10 cartes en main.',
    [{ type: 'ADD_BUYS', amount: 1 }, { type: 'MARQUIS' }]);
export const merchant_camp = k('merchant_camp', 'Campement de marchands', 3, ['ACTION'],
    '+2 Actions, +1 💰. Quand vous défaussez cette carte du jeu, vous pouvez la placer sur votre pioche.',
    [{ type: 'ADD_ACTIONS', amount: 2 }, { type: 'ADD_MONEY', amount: 1 }], { topdeckWhenDiscarded: true });
export const modify = k('modify', 'Modifier', 5, ['ACTION'],
    'Écartez une carte de votre main. Choisissez : +1 Carte et +1 Action ; ou recevez une carte coûtant jusqu\'à 2 💰 de plus que la carte écartée.',
    [{ type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Modifier : écartez une carte', onSuccess: [{ type: 'CHOOSE_OPTION', message: 'Modifier : choisissez', options: [
        { label: '+1 Carte et +1 Action', effects: [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 }] },
        { label: 'Recevoir une carte coûtant jusqu\'à 2 💰 de plus', effects: [{ type: 'GAIN_CARD_PLUS_COST', costBonus: 2 }] }
    ] }] }]);
export const royal_galley = k('royal_galley', 'Galère royale', 4, ['ACTION', 'DURATION'],
    '+1 Carte. Vous pouvez jouer une carte Action non-Durée de votre main. Mettez-la de côté ; si vous le faites, jouez-la au début de votre prochain tour.',
    [{ type: 'DRAW', amount: 1 }, { type: 'ROYAL_GALLEY' }], { durationEffects: [] });
export const sentinel = k('sentinel', 'Sentinelle', 3, ['ACTION'],
    'Regardez les 5 cartes du dessus de votre pioche. Écartez-en jusqu\'à 2. Remettez le reste dans l\'ordre de votre choix.',
    [{ type: 'SENTINEL' }]);
export const skirmisher = k('skirmisher', 'Tirailleur', 5, ['ACTION', 'ATTACK'],
    '+1 Carte, +1 Action, +1 💰. Ce tour-ci, quand vous recevez une carte Attaque, chaque autre joueur défausse jusqu\'à avoir 3 cartes en main.',
    [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 }, { type: 'ADD_MONEY', amount: 1 },
        { type: 'REGISTER_TRIGGER', trigger: 'ON_GAIN', duration: 'TURN', repeat: true, filter: { cardTypes: ['ATTACK'] },
            effects: [{ type: 'ATTACK', attackEffects: [{ type: 'DISCARD', targetSize: 3, message: 'Tirailleur : défaussez jusqu\'à avoir 3 cartes en main' }] }], description: 'Tirailleur' }]);
export const specialist = k('specialist', 'Spécialiste', 5, ['ACTION'],
    'Vous pouvez jouer une carte Action ou Trésor de votre main. Choisissez : la rejouer ; ou en recevoir une copie.',
    [{ type: 'SPECIALIST' }]);
export const swap = k('swap', 'Échange', 5, ['ACTION'],
    '+1 Carte, +1 Action. Vous pouvez remettre une carte Action de votre main sur sa pile pour recevoir en main une carte Action différente coûtant jusqu\'à 5 💰.',
    [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 }, { type: 'SWAP' }]);
export const sycophant = k('sycophant', 'Sycophante', 2, ['ACTION', 'LIAISON'],
    '+1 Action. Défaussez 3 cartes. Si vous en avez défaussé au moins une, +3 💰. Quand vous recevez ou écartez cette carte, +2 Faveurs.',
    [{ type: 'ADD_ACTIONS', amount: 1 }, { type: 'DISCARD', amount: 3, message: 'Sycophante : défaussez 3 cartes', onSuccess: [{ type: 'ADD_MONEY', amount: 3 }] }, LIAISON],
    { onGain: [{ type: 'ADD_FAVORS', amount: 2 }], onTrash: [{ type: 'ADD_FAVORS', amount: 2 }] });
export const town = k('town', 'Ville', 4, ['ACTION'], 'Choisissez : +1 Carte et +2 Actions ; ou +1 Achat et +2 💰.',
    [{ type: 'CHOOSE_OPTION', message: 'Ville : choisissez', options: [
        { label: '+1 Carte et +2 Actions', effects: [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 2 }] },
        { label: '+1 Achat et +2 💰', effects: [{ type: 'ADD_BUYS', amount: 1 }, { type: 'ADD_MONEY', amount: 2 }] }
    ] }]);
export const underling = k('underling', 'Subalterne', 3, ['ACTION', 'LIAISON'], '+1 Carte, +1 Action, +1 Faveur.',
    [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 }, { type: 'ADD_FAVORS', amount: 1 }, LIAISON]);
