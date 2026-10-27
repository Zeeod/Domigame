import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Menagerie — the 30 Kingdom cards and the Horse (official texts). Rules: engine/expansions/MenagerieRules.ts.
 */
const k = (id: string, name: string, cost: number, types: string[], description: string, effects: any[], extra: any = {}): CardDefinition => ({
    id, name, cost, types, expansion: 'menagerie', description, effects, ...extra
} as any);

export const AnimalFair = k('animal_fair', 'Foire aux bestiaux', 7, ['ACTION'],
    '+4 💰. +1 Achat par pile vide de la réserve. Au lieu de payer le coût de cette carte, vous pouvez écarter une carte Action de votre main.',
    [{ type: 'ADD_MONEY', amount: 4 }, { type: 'BUYS_PER_EMPTY_PILE' }], { altCostTrashAction: true });
export const Barge = k('barge', 'Péniche', 5, ['ACTION', 'DURATION'], 'Maintenant ou au début de votre prochain tour : +3 Cartes et +1 Achat.',
    [{ type: 'NOW_OR_LATER', label: '+3 Cartes et +1 Achat', effects: [{ type: 'DRAW', amount: 3 }, { type: 'ADD_BUYS', amount: 1 }] }],
    { durationEffects: [{ type: 'DRAW', amount: 3 }, { type: 'ADD_BUYS', amount: 1 }] });
export const BlackCat = k('black_cat', 'Chat noir', 2, ['ACTION', 'ATTACK', 'REACTION'],
    '+2 Cartes. Si ce n\'est pas votre tour, chaque autre joueur reçoit une Malédiction. Quand un autre joueur reçoit une carte Victoire, vous pouvez jouer cette carte depuis votre main.',
    [{ type: 'DRAW', amount: 2 }, { type: 'BLACK_CAT' }],
    { isReaction: true, reactionTrigger: 'ANY_GAIN', reactionCondition: { type: 'GAIN_TYPE', value: 'VICTORY', othersOnly: true },
        reactionMessage: 'Chat noir : le jouer depuis votre main ?', reactionEffects: [{ type: 'PLAY_THIS_CARD' }] });
export const BountyHunter = k('bounty_hunter', 'Chasseur de primes', 4, ['ACTION'],
    '+1 Action. Exilez une carte de votre main. Si vous n\'en aviez pas de copie en Exil, +3 💰.',
    [{ type: 'ADD_ACTIONS', amount: 1 }, { type: 'EXILE_FROM_HAND', bounty: true }]);
export const CamelTrain = k('camel_train', 'Caravane de chameaux', 3, ['ACTION'],
    'Exilez une carte non-Victoire de la réserve. Quand vous recevez cette carte, exilez un Or de la réserve.',
    [{ type: 'EXILE_FROM_SUPPLY', filter: { excludeTypes: ['VICTORY'] } }], { onGain: [{ type: 'EXILE_FROM_SUPPLY', cardId: 'gold' }] });
export const Cardinal = k('cardinal', 'Cardinal', 4, ['ACTION', 'ATTACK'],
    '+2 💰. Chaque autre joueur dévoile les 2 cartes du dessus de sa pioche, en exile une coûtant de 3 à 6 💰 et défausse le reste.',
    [{ type: 'ADD_MONEY', amount: 2 }, { type: 'ATTACK', attackEffects: [{ type: 'CARDINAL_HIT' }] }]);
export const Cavalry = k('cavalry', 'Cavalerie', 4, ['ACTION'],
    'Recevez 2 Chevaux. Quand vous recevez cette carte, +2 Cartes, +1 Achat, et si c\'est votre phase Achat, retournez à votre phase Action.',
    [{ type: 'GAIN_CARD', cardId: 'horse' }, { type: 'GAIN_CARD', cardId: 'horse' }], { onGain: [{ type: 'CAVALRY_ON_GAIN' }] });
export const Coven = k('coven', 'Assemblée', 5, ['ACTION', 'ATTACK'],
    '+1 Action, +2 💰. Chaque autre joueur exile une Malédiction de la réserve. S\'il ne peut pas, il défausse ses Malédictions exilées.',
    [{ type: 'ADD_ACTIONS', amount: 1 }, { type: 'ADD_MONEY', amount: 2 }, { type: 'ATTACK', attackEffects: [{ type: 'EXILE_CURSE' }] }]);
export const Destrier = k('destrier', 'Destrier', 6, ['ACTION'],
    '+2 Cartes, +1 Action. Pendant vos tours, cette carte coûte 1 💰 de moins par carte que vous avez reçue ce tour-ci.',
    [{ type: 'DRAW', amount: 2 }, { type: 'ADD_ACTIONS', amount: 1 }]);
export const Displace = k('displace', 'Déplacement', 5, ['ACTION'],
    'Exilez une carte de votre main. Recevez une carte de nom différent coûtant jusqu\'à 2 💰 de plus.',
    [{ type: 'EXILE_FROM_HAND', displace: true }]);
export const Falconer = k('falconer', 'Fauconnier', 5, ['ACTION', 'REACTION'],
    'Recevez en main une carte coûtant moins que cette carte. Quand un joueur reçoit une carte ayant 2 types ou plus, vous pouvez jouer cette carte depuis votre main.',
    [{ type: 'GAIN_CHEAPER_THAN', cardId: 'falconer', destination: 'hand' }],
    { isReaction: true, reactionTrigger: 'ANY_GAIN', reactionCondition: { type: 'MULTI_TYPE' },
        reactionMessage: 'Fauconnier : le jouer depuis votre main ?', reactionEffects: [{ type: 'PLAY_THIS_CARD' }] });
export const Fisherman = k('fisherman', 'Pêcheur', 5, ['ACTION'],
    '+1 Carte, +1 Action, +1 💰. Pendant vos tours, si votre défausse est vide, cette carte coûte 3 💰 de moins.',
    [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 }, { type: 'ADD_MONEY', amount: 1 }]);
export const Gatekeeper = k('gatekeeper', 'Gardien de la porte', 5, ['ACTION', 'DURATION', 'ATTACK'],
    'Au début de votre prochain tour, +3 💰. D\'ici là, quand un autre joueur reçoit une carte Action ou Trésor dont il n\'a pas de copie exilée, il l\'exile.',
    [{ type: 'ATTACK', attackEffects: [{ type: 'GATEKEEPER_HIT' }] }], { durationEffects: [{ type: 'ADD_MONEY', amount: 3 }] });
export const Goatherd = k('goatherd', 'Chevrier', 3, ['ACTION'],
    '+1 Action. Vous pouvez écarter une carte de votre main. +1 Carte par carte écartée par le joueur à votre droite à son dernier tour.',
    [{ type: 'ADD_ACTIONS', amount: 1 }, { type: 'TRASH', min: 0, max: 1, from: 'hand', message: 'Chevrier : vous pouvez écarter une carte' }, { type: 'GOATHERD' }]);
export const Groom = k('groom', 'Palefrenier', 4, ['ACTION'],
    'Recevez une carte coûtant jusqu\'à 4 💰. Si c\'est une carte Action, recevez un Cheval ; Trésor, recevez un Argent ; Victoire, +1 Carte et +1 Action.',
    [{ type: 'GAIN_CARD', maxCost: 4, next: [{ type: 'GROOM_AFTER' }], message: 'Palefrenier : recevez une carte coûtant jusqu\'à 4 💰' }]);
export const Hostelry = k('hostelry', 'Hôtellerie', 4, ['ACTION'],
    '+1 Carte, +2 Actions. Quand vous recevez cette carte, vous pouvez défausser autant de Trésors que vous voulez, en les dévoilant, pour recevoir autant de Chevaux.',
    [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 2 }],
    { onGain: [{ type: 'ARTIFICER_START' }, { type: 'DISCARD', min: 0, max: 99, filter: { cardTypes: ['TREASURE'] }, message: 'Hôtellerie : défaussez des Trésors pour autant de Chevaux' }, { type: 'HORSES_PER_DISCARD' }] });
export const HuntingLodge = k('hunting_lodge', 'Pavillon de chasse', 5, ['ACTION'], '+1 Carte, +2 Actions. Vous pouvez défausser votre main pour +5 Cartes.',
    [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 2 }, { type: 'SELECT_OPTION', message: 'Pavillon de chasse : défausser votre main pour +5 Cartes ?', options: [
        { label: 'Oui', effects: [{ type: 'DISCARD', forceAll: true }, { type: 'DRAW', amount: 5 }] }, { label: 'Non', effects: [] }] }]);
export const Kiln = k('kiln', 'Four', 5, ['ACTION'], '+2 💰. La prochaine fois que vous recevez une carte ce tour-ci, vous pouvez d\'abord en recevoir une copie.',
    [{ type: 'ADD_MONEY', amount: 2 }, { type: 'KILN' }]);
export const Livery = k('livery', 'Écurie de louage', 5, ['ACTION'], '+3 💰. Ce tour-ci, quand vous recevez une carte coûtant 4 💰 ou plus, recevez un Cheval.',
    [{ type: 'ADD_MONEY', amount: 3 }, { type: 'REGISTER_TRIGGER', trigger: 'ON_GAIN', duration: 'TURN', repeat: true, filter: { minCost: 4 },
        effects: [{ type: 'GAIN_CARD', cardId: 'horse' }], description: 'Écurie de louage' }]);
export const Mastermind = k('mastermind', 'Cerveau', 5, ['ACTION', 'DURATION'], 'Au début de votre prochain tour, vous pouvez jouer trois fois une carte Action de votre main.',
    [], { durationEffects: [{ type: 'MASTERMIND' }] });
export const Paddock = k('paddock', 'Enclos', 5, ['ACTION'], '+2 💰. Recevez 2 Chevaux. +1 Action par pile vide de la réserve.',
    [{ type: 'ADD_MONEY', amount: 2 }, { type: 'GAIN_CARD', cardId: 'horse' }, { type: 'GAIN_CARD', cardId: 'horse' }, { type: 'ACTIONS_PER_EMPTY_PILE' }]);
export const Sanctuary = k('sanctuary', 'Sanctuaire', 5, ['ACTION'], '+1 Carte, +1 Action, +1 Achat. Vous pouvez exiler une carte de votre main.',
    [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 1 }, { type: 'ADD_BUYS', amount: 1 }, { type: 'EXILE_FROM_HAND', optional: true }]);
export const Scrap = k('scrap', 'Ferraille', 3, ['ACTION'],
    'Écartez une carte de votre main. Choisissez une chose différente par 💰 de son coût : +1 Carte ; +1 Action ; +1 Achat ; +1 💰 ; recevez un Argent ; recevez un Cheval.',
    [{ type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Ferraille : écartez une carte', onSuccess: [{ type: 'SCRAP_BONUSES' }] }]);
export const Sheepdog = k('sheepdog', 'Chien de berger', 3, ['ACTION', 'REACTION'], '+2 Cartes. Quand vous recevez une carte, vous pouvez jouer cette carte depuis votre main.',
    [{ type: 'DRAW', amount: 2 }], { isReaction: true, reactionTrigger: 'GAIN', reactionEffects: [{ type: 'PLAY_THIS_CARD' }] });
export const Sleigh = k('sleigh', 'Traîneau', 2, ['ACTION', 'REACTION'],
    'Recevez 2 Chevaux. Quand vous recevez une carte, vous pouvez défausser cette carte pour prendre la carte reçue en main ou la placer sur votre pioche.',
    [{ type: 'GAIN_CARD', cardId: 'horse' }, { type: 'GAIN_CARD', cardId: 'horse' }],
    { isReaction: true, reactionTrigger: 'GAIN', reactionEffects: [{ type: 'SLEIGH' }] });
export const SnowyVillage = k('snowy_village', 'Village enneigé', 3, ['ACTION'], '+1 Carte, +4 Actions, +1 Achat. Ignorez tout +Action supplémentaire ce tour-ci.',
    [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 4 }, { type: 'ADD_BUYS', amount: 1 }, { type: 'IGNORE_EXTRA_ACTIONS' }]);
export const Stockpile = k('stockpile', 'Réserves', 3, ['TREASURE'], '3 💰, +1 Achat. Quand vous jouez cette carte, exilez-la.',
    [{ type: 'ADD_MONEY', amount: 3 }, { type: 'ADD_BUYS', amount: 1 }, { type: 'EXILE_SELF' }], { treasureValue: 0 });
export const Supplies = k('supplies', 'Provisions', 2, ['TREASURE'], '1 💰. Quand vous jouez cette carte, recevez un Cheval sur votre pioche.',
    [{ type: 'ADD_MONEY', amount: 1 }, { type: 'GAIN_CARD', cardId: 'horse', destination: 'deck' }], { treasureValue: 0 });
export const VillageGreen = k('village_green', 'Pré communal', 4, ['ACTION', 'DURATION', 'REACTION'],
    'Maintenant ou au début de votre prochain tour, +1 Carte et +2 Actions. Quand vous défaussez cette carte hors Ajustement, vous pouvez la dévoiler pour la jouer.',
    [{ type: 'NOW_OR_LATER', label: '+1 Carte et +2 Actions', effects: [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 2 }] }],
    { durationEffects: [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 2 }], onDiscardOutsideCleanup: [{ type: 'MAY_PLAY_THIS' }] });
export const Wayfarer = k('wayfarer', 'Voyageur', 6, ['ACTION'],
    '+3 Cartes. Vous pouvez recevoir un Argent. Cette carte a le même coût que la dernière autre carte reçue ce tour-ci, s\'il y en a une.',
    [{ type: 'DRAW', amount: 3 }, { type: 'SELECT_OPTION', message: 'Voyageur : recevoir un Argent ?', options: [
        { label: 'Oui', effects: [{ type: 'GAIN_CARD', cardId: 'silver' }] }, { label: 'Non', effects: [] }] }]);
