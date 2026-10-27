import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Plunder — the 40 Kingdom cards (official texts). Rules: engine/expansions/PlunderRules.ts.
 */
const k = (id: string, name: string, cost: number, types: string[], description: string, effects: any[], extra: any = {}): CardDefinition => ({
    id, name, cost, types, expansion: 'plunder', description, effects, ...extra
} as any);
const LOOT = { type: 'GAIN_LOOT' };

// ---------------------------------------------------------------- $2
export const cage = k('cage', 'Cage', 2, ['TREASURE', 'DURATION'],
    'Mettez de côté face cachée jusqu\'à 4 cartes de votre main. La prochaine fois que vous recevez une carte Victoire, écartez cette carte et prenez en main les cartes mises de côté à la fin du tour.',
    [{ type: 'CAGE' }], { treasureValue: 0, durationEffects: [] });
export const grotto = k('grotto', 'Grotte', 2, ['ACTION', 'DURATION'],
    '+1 Action. Mettez de côté face cachée jusqu\'à 4 cartes de votre main. Au début de votre prochain tour, défaussez-les, puis piochez autant de cartes.',
    [{ type: 'ADD_ACTIONS', amount: 1 }, { type: 'GROTTO' }], { durationEffects: [{ type: 'GROTTO_RETURN' }] });
export const jewelled_egg = k('jewelled_egg', 'Œuf orné de joyaux', 2, ['TREASURE'], '1 💰. +1 Achat. Quand vous écartez cette carte, recevez un Butin.',
    [{ type: 'ADD_MONEY', amount: 1 }, { type: 'ADD_BUYS', amount: 1 }], { treasureValue: 0, onTrash: [LOOT] });
export const search = k('search', 'Fouille', 2, ['ACTION', 'DURATION'],
    '+2 💰. La prochaine fois qu\'une pile de la réserve se vide, écartez cette carte et recevez un Butin.',
    [{ type: 'ADD_MONEY', amount: 2 }, { type: 'SEARCH' }], { durationEffects: [] });
export const shaman = k('shaman', 'Chamane', 2, ['ACTION'],
    '+1 Action, +1 💰. Vous pouvez écarter une carte de votre main. Dans les parties utilisant cette carte, au début de votre tour, recevez une carte du rebut coûtant jusqu\'à 6 💰.',
    [{ type: 'ADD_ACTIONS', amount: 1 }, { type: 'ADD_MONEY', amount: 1 }, { type: 'TRASH', min: 0, max: 1, from: 'hand', message: 'Chamane : vous pouvez écarter une carte' }]);

// ---------------------------------------------------------------- $3
export const secluded_shrine = k('secluded_shrine', 'Sanctuaire isolé', 3, ['ACTION', 'DURATION'],
    '+1 💰. La prochaine fois que vous recevez un Trésor, écartez jusqu\'à 2 cartes de votre main.',
    [{ type: 'ADD_MONEY', amount: 1 }, { type: 'SECLUDED_SHRINE' }], { durationEffects: [] });
export const siren = k('siren', 'Sirène', 3, ['ACTION', 'DURATION', 'ATTACK'],
    'Chaque autre joueur reçoit une Malédiction. Au début de votre prochain tour, piochez jusqu\'à avoir 8 cartes en main. Quand vous recevez cette carte, écartez-la à moins d\'écarter une carte Action de votre main.',
    [{ type: 'ATTACK', attackEffects: [{ type: 'GAIN_CARD', cardId: 'curse' }] }],
    { durationEffects: [{ type: 'DRAW_UNTIL_HAND_SIZE', targetSize: 8 }], onGain: [{ type: 'SIREN_GAINED' }] });
export const stowaway = k('stowaway', 'Passager clandestin', 3, ['ACTION', 'DURATION', 'REACTION'],
    'Au début de votre prochain tour, +2 Cartes. Quand un joueur reçoit une carte Durée, vous pouvez jouer cette carte depuis votre main.',
    [], { durationEffects: [{ type: 'DRAW', amount: 2 }], isReaction: true, reactionTrigger: 'ANY_GAIN', reactionCondition: { type: 'GAIN_TYPE', value: 'DURATION' },
        reactionMessage: 'Passager clandestin : le jouer depuis votre main ?', reactionEffects: [{ type: 'PLAY_THIS_CARD' }] });
export const taskmaster = k('taskmaster', 'Contremaître', 3, ['ACTION', 'DURATION'],
    '+1 Action, +1 💰. Si vous recevez une carte coûtant exactement 5 💰 ce tour-ci, alors au début de votre prochain tour, répétez cette capacité.',
    [{ type: 'ADD_ACTIONS', amount: 1 }, { type: 'ADD_MONEY', amount: 1 }, { type: 'TASKMASTER' }], { durationEffects: [{ type: 'TASKMASTER_REPEAT' }] });

// ---------------------------------------------------------------- $4
export const abundance = k('abundance', 'Abondance', 4, ['TREASURE', 'DURATION'],
    'La prochaine fois que vous recevez une carte Action, +1 Achat et +3 💰.', [{ type: 'ABUNDANCE' }], { treasureValue: 0, durationEffects: [] });
export const cabin_boy = k('cabin_boy', 'Mousse', 4, ['ACTION', 'DURATION'],
    '+1 Carte, +1 Action. Au début de votre prochain tour, choisissez : +2 💰 ; ou écartez cette carte pour recevoir une carte Durée.',
    [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 }], { durationEffects: [{ type: 'CABIN_BOY' }] });
export const crucible = k('crucible', 'Creuset', 4, ['TREASURE'], 'Écartez une carte de votre main. +1 💰 par 💰 de son coût.',
    [{ type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Creuset : écartez une carte', onSuccess: [{ type: 'MONEY_PER_TRASHED_COST' }] }], { treasureValue: 0 });
export const flagship = k('flagship', 'Vaisseau amiral', 4, ['ACTION', 'DURATION', 'COMMAND'],
    '+2 💰. La prochaine fois que vous jouez une carte Action non-Ordre, rejouez-la.', [{ type: 'ADD_MONEY', amount: 2 }, { type: 'FLAGSHIP' }], { durationEffects: [] });
export const fortune_hunter = k('fortune_hunter', 'Chasseur de fortune', 4, ['ACTION'],
    '+2 💰. Regardez les 3 cartes du dessus de votre pioche. Vous pouvez jouer un Trésor parmi elles. Remettez le reste dans l\'ordre de votre choix.',
    [{ type: 'ADD_MONEY', amount: 2 }, { type: 'FORTUNE_HUNTER' }]);
export const gondola = k('gondola', 'Gondole', 4, ['TREASURE', 'DURATION'],
    'Maintenant ou au début de votre prochain tour : +2 💰. Quand vous recevez cette carte, vous pouvez jouer une carte Action de votre main.',
    [{ type: 'NOW_OR_LATER', label: '+2 💰', effects: [{ type: 'ADD_MONEY', amount: 2 }] }],
    { treasureValue: 0, durationEffects: [{ type: 'ADD_MONEY', amount: 2 }], onGain: [{ type: 'MAY_PLAY_FROM_HAND', filter: { cardTypes: ['ACTION'] }, message: 'Gondole : jouer une Action de votre main ?' }] });
export const harbor_village = k('harbor_village', 'Village portuaire', 4, ['ACTION'],
    '+1 Carte, +2 Actions. Après la prochaine Action que vous jouez ce tour-ci, si elle vous a donné +💰, +1 💰.',
    [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 2 }, { type: 'HARBOR_VILLAGE' }]);
export const landing_party = k('landing_party', 'Débarquement', 4, ['ACTION', 'DURATION'],
    '+2 Cartes, +1 Action. La prochaine fois que la première carte que vous jouez dans un tour est un Trésor, placez cette carte sur votre pioche ensuite.',
    [{ type: 'DRAW', amount: 2 }, { type: 'ADD_ACTIONS', amount: 1 }, { type: 'LANDING_PARTY' }], { durationEffects: [] });
export const mapmaker = k('mapmaker', 'Cartographe', 4, ['ACTION', 'REACTION'],
    'Regardez les 4 cartes du dessus de votre pioche. Prenez-en 2 en main et défaussez le reste. Quand un joueur reçoit une carte Victoire, vous pouvez jouer cette carte depuis votre main.',
    [{ type: 'MAPMAKER' }], { isReaction: true, reactionTrigger: 'ANY_GAIN', reactionCondition: { type: 'GAIN_TYPE', value: 'VICTORY' },
        reactionMessage: 'Cartographe : le jouer depuis votre main ?', reactionEffects: [{ type: 'PLAY_THIS_CARD' }] });
export const maroon = k('maroon', 'Marron', 4, ['ACTION'], 'Écartez une carte de votre main. +2 Cartes par type qu\'elle a (Action, Attaque, etc.).',
    [{ type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Marron : écartez une carte', onSuccess: [{ type: 'MAROON' }] }]);
export const rope = k('rope', 'Corde', 4, ['TREASURE', 'DURATION'], '1 💰. +1 Achat. Au début de votre prochain tour, +1 Carte et vous pouvez écarter une carte de votre main.',
    [{ type: 'ADD_MONEY', amount: 1 }, { type: 'ADD_BUYS', amount: 1 }],
    { treasureValue: 0, durationEffects: [{ type: 'DRAW', amount: 1 }, { type: 'TRASH', min: 0, max: 1, from: 'hand', message: 'Corde : vous pouvez écarter une carte' }] });
export const swamp_shacks = k('swamp_shacks', 'Cabanes du marais', 4, ['ACTION'], '+2 Actions. +1 Carte par tranche de 3 cartes que vous avez en jeu (arrondi à l\'inférieur).',
    [{ type: 'ADD_ACTIONS', amount: 2 }, { type: 'SWAMP_SHACKS' }]);
export const tools = k('tools', 'Outils', 4, ['TREASURE'], 'Recevez un exemplaire d\'une carte qu\'un joueur a en jeu.', [{ type: 'TOOLS' }], { treasureValue: 0 });

// ---------------------------------------------------------------- $5
export const buried_treasure = k('buried_treasure', 'Trésor enfoui', 5, ['TREASURE', 'DURATION'],
    'Au début de votre prochain tour, +1 Achat et +3 💰. Quand vous recevez cette carte, jouez-la.',
    [], { treasureValue: 0, durationEffects: [{ type: 'ADD_BUYS', amount: 1 }, { type: 'ADD_MONEY', amount: 3 }], onGain: [{ type: 'PLAY_GAINED_THIS' }] });
export const crew = k('crew', 'Équipage', 5, ['ACTION', 'DURATION'], '+3 Cartes. Au début de votre prochain tour, placez cette carte sur votre pioche.',
    [{ type: 'DRAW', amount: 3 }], { durationEffects: [{ type: 'TOPDECK_SELF' }] });
export const cutthroat = k('cutthroat', 'Coupe-jarret', 5, ['ACTION', 'DURATION', 'ATTACK'],
    'Chaque autre joueur défausse jusqu\'à avoir 3 cartes en main. La prochaine fois qu\'un joueur reçoit un Trésor coûtant 5 💰 ou plus, recevez un Butin.',
    [{ type: 'ATTACK', attackEffects: [{ type: 'DISCARD', targetSize: 3, message: 'Coupe-jarret : défaussez jusqu\'à avoir 3 cartes en main' }] }, { type: 'CUTTHROAT' }], { durationEffects: [] });
export const enlarge = k('enlarge', 'Agrandir', 5, ['ACTION', 'DURATION'],
    'Maintenant et au début de votre prochain tour : écartez une carte de votre main et recevez-en une coûtant jusqu\'à 2 💰 de plus.',
    [{ type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Agrandir : écartez une carte', onSuccess: [{ type: 'GAIN_CARD_PLUS_COST', costBonus: 2 }] }],
    { durationEffects: [{ type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Agrandir : écartez une carte', onSuccess: [{ type: 'GAIN_CARD_PLUS_COST', costBonus: 2 }] }] });
export const figurine = k('figurine', 'Figurine', 5, ['TREASURE'], '+2 Cartes. Vous pouvez défausser une carte Action pour +1 Achat et +1 💰.',
    [{ type: 'DRAW', amount: 2 }, { type: 'DISCARD', min: 0, max: 1, filter: { cardTypes: ['ACTION'] }, message: 'Figurine : défausser une Action pour +1 Achat et +1 💰 ?',
        onSuccess: [{ type: 'ADD_BUYS', amount: 1 }, { type: 'ADD_MONEY', amount: 1 }] }], { treasureValue: 0 });
export const first_mate = k('first_mate', 'Second', 5, ['ACTION'],
    'Jouez autant de cartes Action de même nom que vous voulez depuis votre main, puis piochez jusqu\'à avoir 6 cartes en main.',
    [{ type: 'FIRST_MATE' }]);
export const frigate = k('frigate', 'Frégate', 5, ['ACTION', 'DURATION', 'ATTACK'],
    '+3 💰. Jusqu\'au début de votre prochain tour, chaque fois qu\'un autre joueur joue une carte Action, il défausse ensuite jusqu\'à avoir 4 cartes en main.',
    [{ type: 'ADD_MONEY', amount: 3 }, { type: 'ATTACK', attackEffects: [{ type: 'FRIGATE_HIT' }] }], { durationEffects: [{ type: 'FRIGATE_END' }] });
export const longship = k('longship', 'Drakkar', 5, ['ACTION', 'DURATION'], '+2 Actions. Au début de votre prochain tour, +2 Cartes.',
    [{ type: 'ADD_ACTIONS', amount: 2 }], { durationEffects: [{ type: 'DRAW', amount: 2 }] });
export const mining_road = k('mining_road', 'Route minière', 5, ['ACTION'],
    '+1 Action, +1 Achat, +2 💰. Une fois par tour, quand vous recevez un Trésor, vous pouvez le jouer.',
    [{ type: 'ADD_ACTIONS', amount: 1 }, { type: 'ADD_BUYS', amount: 1 }, { type: 'ADD_MONEY', amount: 2 }, { type: 'MINING_ROAD' }]);
export const pendant = k('pendant', 'Pendentif', 5, ['TREASURE'], '+1 💰 par Trésor de nom différent que vous avez en jeu.', [{ type: 'PENDANT' }], { treasureValue: 0 });
export const pickaxe = k('pickaxe', 'Pioche', 5, ['TREASURE'], '1 💰. Écartez une carte de votre main. Si elle coûte 3 💰 ou plus, recevez un Butin en main.',
    [{ type: 'ADD_MONEY', amount: 1 }, { type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Pioche : écartez une carte', onSuccess: [{ type: 'PICKAXE' }] }], { treasureValue: 0 });
export const pilgrim = k('pilgrim', 'Pèlerin', 5, ['ACTION'], '+4 Cartes. Placez une carte de votre main sur votre pioche.',
    [{ type: 'DRAW', amount: 4 }, { type: 'PILGRIM_TOPDECK' }]);
export const quartermaster = k('quartermaster', 'Intendant', 5, ['ACTION', 'DURATION'],
    'Au début de chacun de vos tours pour le reste de la partie, choisissez : recevez une carte coûtant jusqu\'à 4 💰, en la mettant de côté sur celle-ci ; ou prenez en main une carte d\'ici.',
    [], { isPermanentDuration: true, durationEffects: [{ type: 'QUARTERMASTER' }] });
export const silver_mine = k('silver_mine', 'Mine d\'argent', 5, ['TREASURE'], 'Recevez en main un Trésor coûtant moins que cette carte.',
    [{ type: 'GAIN_CHEAPER_THAN', cardId: 'silver_mine', destination: 'hand', filter: { cardTypes: ['TREASURE'] } }], { treasureValue: 0 });
export const trickster = k('trickster', 'Filou', 5, ['ACTION', 'ATTACK'],
    'Chaque autre joueur reçoit une Malédiction. Une fois ce tour-ci, quand vous défaussez un Trésor du jeu, vous pouvez le mettre de côté. Prenez-le en main à la fin du tour.',
    [{ type: 'ATTACK', attackEffects: [{ type: 'GAIN_CARD', cardId: 'curse' }] }, { type: 'TRICKSTER' }]);
export const wealthy_village = k('wealthy_village', 'Village prospère', 5, ['ACTION'],
    '+1 Carte, +2 Actions. Quand vous recevez cette carte, si vous avez au moins 3 Trésors de noms différents en jeu, recevez un Butin.',
    [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 2 }], { onGain: [{ type: 'WEALTHY_VILLAGE' }] });

// ---------------------------------------------------------------- $6+
export const sack_of_loot = k('sack_of_loot', 'Sac de butin', 6, ['TREASURE'], '1 💰. +1 Achat. Recevez un Butin.',
    [{ type: 'ADD_MONEY', amount: 1 }, { type: 'ADD_BUYS', amount: 1 }, LOOT], { treasureValue: 0 });
export const kings_cache = k('kings_cache', 'Trésor du roi', 7, ['TREASURE'], 'Vous pouvez jouer un Trésor de votre main trois fois.',
    [{ type: 'KINGS_CACHE' }], { treasureValue: 0 });
