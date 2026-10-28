import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Rising Sun — the 25 Kingdom cards (official texts, 2024 rulebook).
 * Rules: engine/expansions/RisingSunCards.ts (Omens, Shadows, Daimyo, Riverboat…).
 */
const k = (id: string, name: string, cost: number, types: string[], description: string, effects: any[], extra: any = {}): CardDefinition => ({
    id, name, cost, types, description, effects, expansion: 'rising_sun', ...extra
} as any);
const SUN = { type: 'GAIN_SUN' };
const SHADOW_TEXT = ' Vous pouvez jouer cette carte depuis votre pioche comme si elle était dans votre main.';
const card = (n: number) => ({ type: 'DRAW', amount: n });
const action = (n: number) => ({ type: 'ADD_ACTIONS', amount: n });
const buy = (n: number) => ({ type: 'ADD_BUYS', amount: n });
const coins = (n: number) => ({ type: 'ADD_MONEY', amount: n });
const debt = (n: number) => ({ type: 'TAKE_DEBT', amount: n });
const DOWN_TO_3 = { type: 'ATTACK', attackEffects: [{ type: 'DISCARD', targetSize: 3, message: 'Défaussez jusqu\'à avoir 3 cartes en main' }] };

export const alley = k('alley', 'Allée', 4, ['ACTION', 'SHADOW'], '+1 Carte. +1 Action. Défaussez une carte.' + SHADOW_TEXT,
    [card(1), action(1), { type: 'DISCARD', amount: 1, message: 'Allée : défaussez une carte' }]);
export const aristocrat = k('aristocrat', 'Aristocrate', 5, ['ACTION'],
    'Selon le nombre d\'Aristocrates que vous avez en jeu : 1 ou 5 : +3 Actions ; 2 ou 6 : +3 Cartes ; 3 ou 7 : +3 💰 ; 4 ou 8 : +3 Achats.',
    [{ type: 'ARISTOCRAT' }]);
export const artist = k('artist', 'Artiste', 0, ['ACTION'], '+1 Action. +1 Carte par carte dont vous avez exactement un exemplaire en jeu.',
    [action(1), { type: 'ARTIST' }], { debtCost: 8 });
export const change = k('change', 'Changement', 4, ['ACTION'],
    'Si vous avez des Dettes, +3 💰. Sinon, écartez une carte de votre main et recevez une carte coûtant plus de 💰 qu\'elle. +Dettes égales à la différence de 💰.',
    [{ type: 'CHANGE' }]);
export const craftsman = k('craftsman', 'Artisan (Soleil Levant)', 3, ['ACTION'], '+2 Dettes. Recevez une carte coûtant jusqu\'à 5 💰.',
    [debt(2), { type: 'GAIN_CARD', maxCost: 5, message: 'Artisan : recevez une carte coûtant jusqu\'à 5 💰' }]);
export const daimyo = k('daimyo', 'Daimyo', 0, ['ACTION', 'COMMAND'],
    '+1 Carte. +1 Action. La prochaine fois que vous jouez une carte Action non-Ordre ce tour-ci, rejouez-la ensuite.',
    [card(1), action(1), { type: 'DAIMYO' }], { debtCost: 6 });
export const fishmonger = k('fishmonger', 'Poissonnier', 2, ['ACTION', 'SHADOW'], '+1 Achat. +1 💰.' + SHADOW_TEXT, [buy(1), coins(1)]);
export const gold_mine = k('gold_mine', 'Mine d\'or', 5, ['ACTION'], '+1 Carte. +1 Action. +1 Achat. Vous pouvez recevoir un Or et prendre +4 Dettes.',
    [card(1), action(1), buy(1), { type: 'SELECT_OPTION', message: 'Mine d\'or : recevoir un Or et prendre 4 Dettes ?', options: [
        { label: 'Oui (Or, +4 Dettes)', effects: [{ type: 'GAIN_CARD', cardId: 'gold' }, debt(4)] },
        { label: 'Non', effects: [] }
    ] }]);
export const imperial_envoy = k('imperial_envoy', 'Émissaire Impérial', 5, ['ACTION'], '+5 Cartes. +1 Achat. +2 Dettes.', [card(5), buy(1), debt(2)]);
export const kitsune = k('kitsune', 'Kitsune', 5, ['ACTION', 'ATTACK', 'OMEN'],
    '+1 Soleil. Choisissez deux options différentes : +2 Actions ; +2 💰 ; chaque autre joueur reçoit une Malédiction ; recevez un Argent.',
    [SUN, { type: 'SELECT_OPTION', message: 'Kitsune : choisissez deux options différentes', min: 2, max: 2, options: [
        { label: '+2 Actions', effects: [action(2)] },
        { label: '+2 💰', effects: [coins(2)] },
        { label: 'Chaque autre joueur reçoit une Malédiction', effects: [{ type: 'ATTACK', attackEffects: [{ type: 'GAIN_CARD', cardId: 'curse' }] }] },
        { label: 'Recevez un Argent', effects: [{ type: 'GAIN_CARD', cardId: 'silver' }] }
    ] }]);
export const litter = k('litter', 'Portée', 5, ['ACTION'], '+2 Cartes. +2 Actions. +1 Dette.', [card(2), action(2), debt(1)]);
export const mountain_shrine = k('mountain_shrine', 'Sanctuaire de Montagne', 0, ['ACTION', 'OMEN'],
    '+1 Soleil. +2 💰. Vous pouvez écarter une carte de votre main. Ensuite, s\'il y a des cartes Action au rebut, +2 Cartes.',
    [SUN, coins(2), { type: 'TRASH', min: 0, max: 1, from: 'hand', message: 'Sanctuaire de Montagne : vous pouvez écarter une carte' }, { type: 'MOUNTAIN_SHRINE' }],
    { debtCost: 5 });
export const ninja = k('ninja', 'Ninja', 4, ['ACTION', 'ATTACK', 'SHADOW'], '+1 Carte. Chaque autre joueur défausse jusqu\'à avoir 3 cartes en main.' + SHADOW_TEXT,
    [card(1), DOWN_TO_3]);
export const poet = k('poet', 'Poète', 4, ['ACTION', 'OMEN'],
    '+1 Soleil. +1 Carte. +1 Action. Dévoilez la carte du dessus de votre pioche. Si elle coûte 3 💰 ou moins, prenez-la en main.',
    [SUN, card(1), action(1), { type: 'POET' }]);
export const rice = k('rice', 'Riz', 7, ['TREASURE'], '+1 Achat. +1 💰 par type différent parmi les cartes que vous avez en jeu.',
    [buy(1), { type: 'RICE' }], { treasureValue: 0 });
export const rice_broker = k('rice_broker', 'Courtier en Riz', 5, ['ACTION'],
    '+1 Action. Écartez une carte de votre main. Si c\'est un Trésor, +2 Cartes. Si c\'est une Action, +5 Cartes.',
    [action(1), { type: 'RICE_BROKER' }]);
export const river_shrine = k('river_shrine', 'Sanctuaire de Rivière', 4, ['ACTION', 'OMEN'],
    '+1 Soleil. Écartez jusqu\'à 2 cartes de votre main. Au début de l\'Ajustement, si vous n\'avez reçu aucune carte pendant votre phase Achat ce tour-ci, recevez une carte coûtant jusqu\'à 4 💰.',
    [SUN, { type: 'TRASH', min: 0, max: 2, from: 'hand', message: 'Sanctuaire de Rivière : écartez jusqu\'à 2 cartes' }, { type: 'RIVER_SHRINE' }]);
export const riverboat = k('riverboat', 'Bateau de Rivière', 3, ['ACTION', 'DURATION'],
    'Au début de votre prochain tour, jouez la carte mise de côté, en l\'y laissant. Mise en place : mettez de côté une carte Action non-Durée inutilisée coûtant 5 💰.',
    [], { durationEffects: [{ type: 'RIVERBOAT' }] });
export const ronin = k('ronin', 'Ronin', 5, ['ACTION', 'SHADOW'], 'Piochez jusqu\'à avoir 7 cartes en main.' + SHADOW_TEXT,
    [{ type: 'DRAW_UNTIL_HAND_SIZE', targetSize: 7 }]);
export const root_cellar = k('root_cellar', 'Cave à Légumes', 3, ['ACTION'], '+3 Cartes. +1 Action. +3 Dettes.', [card(3), action(1), debt(3)]);
export const rustic_village = k('rustic_village', 'Village Rustique', 4, ['ACTION', 'OMEN'],
    '+1 Soleil. +1 Carte. +2 Actions. Vous pouvez défausser 2 cartes pour +1 Carte.',
    [SUN, card(1), action(2), { type: 'RUSTIC_VILLAGE' }]);
export const samurai = k('samurai', 'Samouraï', 6, ['ACTION', 'DURATION', 'ATTACK'],
    'Chaque autre joueur défausse jusqu\'à avoir 3 cartes en main (une fois). Au début de chacun de vos tours de la partie, +1 💰. (Cette carte reste en jeu.)',
    [DOWN_TO_3], { isPermanentDuration: true, durationEffects: [coins(1)] });
export const snake_witch = k('snake_witch', 'Sorcière aux Serpents', 2, ['ACTION', 'ATTACK'],
    '+1 Carte. +1 Action. Si votre main ne contient aucun doublon, vous pouvez la dévoiler et remettre cette carte dans sa pile, pour que chaque autre joueur reçoive une Malédiction.',
    [card(1), action(1), { type: 'SNAKE_WITCH' }]);
export const tanuki = k('tanuki', 'Tanuki', 5, ['ACTION', 'SHADOW'], 'Écartez une carte de votre main. Recevez une carte coûtant jusqu\'à 2 💰 de plus qu\'elle.' + SHADOW_TEXT,
    [{ type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Tanuki : écartez une carte', onSuccess: [{ type: 'GAIN_CARD_PLUS_COST', costBonus: 2 }] }]);
export const tea_house = k('tea_house', 'Maison de Thé', 5, ['ACTION', 'OMEN'], '+1 Soleil. +1 Carte. +1 Action. +2 💰.', [SUN, card(1), action(1), coins(2)]);
