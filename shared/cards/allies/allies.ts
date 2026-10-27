import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Allies — the 23 Ally cards (official texts). One is used when a Liaison is in the kingdom.
 * Their abilities live in engine/expansions/AlliesRules.ts.
 */
const ally = (id: string, name: string, description: string): CardDefinition => ({
    id, name, cost: 0, types: ['ALLY'], description, effects: [], expansion: 'allies'
} as any);

export const architects_guild = ally('architects_guild', 'Guilde des architectes',
    'Quand vous recevez une carte, vous pouvez dépenser 2 Faveurs pour recevoir une carte non-Victoire coûtant moins qu\'elle.');
export const band_of_nomads = ally('band_of_nomads', 'Bande de nomades',
    'Quand vous recevez une carte coûtant 3 💰 ou plus, vous pouvez dépenser une Faveur pour +1 Carte, ou +1 Action, ou +1 Achat.');
export const cave_dwellers = ally('cave_dwellers', 'Troglodytes',
    'Au début de votre tour, vous pouvez dépenser une Faveur pour défausser une carte puis piocher une carte. Répétez autant que vous voulez.');
export const circle_of_witches = ally('circle_of_witches', 'Cercle de sorcières',
    'Après avoir joué une Liaison, vous pouvez dépenser 3 Faveurs pour que chaque autre joueur reçoive une Malédiction.');
export const city_state = ally('city_state', 'Cité-État',
    'Pendant vos tours, quand vous recevez une carte Action, vous pouvez dépenser 2 Faveurs pour la jouer.');
export const coastal_haven = ally('coastal_haven', 'Havre côtier',
    'Quand vous défaussez votre main pendant l\'Ajustement, vous pouvez dépenser autant de Faveurs que vous voulez pour garder autant de cartes en main pour votre prochain tour (vous piochez quand même 5 cartes).');
export const crafters_guild = ally('crafters_guild', 'Guilde des artisans',
    'Au début de votre tour, vous pouvez dépenser 2 Faveurs pour recevoir une carte coûtant jusqu\'à 4 💰 sur votre pioche.');
export const desert_guides = ally('desert_guides', 'Guides du désert',
    'Au début de votre tour, vous pouvez dépenser une Faveur pour défausser votre main et piocher 5 cartes. Répétez autant que vous voulez.');
export const family_of_inventors = ally('family_of_inventors', 'Famille d\'inventeurs',
    'Au début de votre phase Achat, vous pouvez placer un jeton Faveur sur une pile non-Victoire de la réserve. Les cartes coûtent 1 💰 de moins par jeton Faveur sur leur pile.');
export const fellowship_of_scribes = ally('fellowship_of_scribes', 'Confrérie des scribes',
    'Après avoir joué une Action, si vous avez 4 cartes ou moins en main, vous pouvez dépenser une Faveur pour +1 Carte.');
export const forest_dwellers = ally('forest_dwellers', 'Habitants des forêts',
    'Au début de votre tour, vous pouvez dépenser une Faveur pour regarder les 3 cartes du dessus de votre pioche. Défaussez-en autant que vous voulez et remettez le reste dans l\'ordre de votre choix.');
export const gang_of_pickpockets = ally('gang_of_pickpockets', 'Bande de pickpockets',
    'Au début de votre tour, défaussez jusqu\'à avoir 4 cartes en main, à moins de dépenser une Faveur.');
export const island_folk = ally('island_folk', 'Peuple des îles',
    'À la fin de votre tour, si le tour précédent n\'était pas le vôtre, vous pouvez dépenser 5 Faveurs pour jouer un autre tour.');
export const league_of_bankers = ally('league_of_bankers', 'Ligue des banquiers',
    'Au début de votre phase Achat, +1 💰 par tranche de 4 Faveurs que vous avez (arrondi à l\'inférieur).');
export const league_of_shopkeepers = ally('league_of_shopkeepers', 'Ligue des boutiquiers',
    'Après avoir joué une Liaison, si vous avez 5 Faveurs ou plus, +1 💰 ; et si vous en avez 10 ou plus, +1 Action et +1 Achat.');
export const market_towns = ally('market_towns', 'Villes de marché',
    'Au début de votre phase Achat, vous pouvez dépenser une Faveur pour jouer une carte Action de votre main. Répétez autant que vous voulez.');
export const mountain_folk = ally('mountain_folk', 'Peuple des montagnes',
    'Au début de votre tour, vous pouvez dépenser 5 Faveurs pour +3 Cartes.');
export const order_of_astrologers = ally('order_of_astrologers', 'Ordre des astrologues',
    'Quand vous mélangez, vous pouvez choisir une carte par Faveur que vous dépensez, à placer sur le dessus.');
export const order_of_masons = ally('order_of_masons', 'Ordre des maçons',
    'Quand vous mélangez, vous pouvez choisir jusqu\'à deux cartes par Faveur que vous dépensez, à placer dans votre défausse.');
export const peaceful_cult = ally('peaceful_cult', 'Culte paisible',
    'Au début de votre phase Achat, vous pouvez dépenser autant de Faveurs que vous voulez pour écarter autant de cartes de votre main.');
export const plateau_shepherds = ally('plateau_shepherds', 'Bergers des plateaux',
    'Lors du décompte, associez vos Faveurs aux cartes que vous possédez coûtant 2 💰 : 2 PV par paire.');
export const trappers_lodge = ally('trappers_lodge', 'Maison des trappeurs',
    'Quand vous recevez une carte, vous pouvez dépenser une Faveur pour la placer sur votre pioche.');
export const woodcarvers_guild = ally('woodcarvers_guild', 'Guilde des sculpteurs sur bois',
    'Au début de votre phase Achat, vous pouvez dépenser une Faveur pour écarter une carte Action de votre main. Si vous le faites, recevez une carte Action.');
