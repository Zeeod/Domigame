import { CardDefinition } from '../../types/CardDefinition.js';

export const avoid: CardDefinition = { id: 'avoid', name: 'Éviter', cost: 2, types: ['EVENT'], description: "Mettez de côté n'importe quel nombre de cartes de votre main. À la fin de votre phase de nettoyage, défaussez-les et +1 Carte pour chacune.", expansion: 'plunder' };
export const bury: CardDefinition = { id: 'bury', name: 'Enterrer', cost: 1, types: ['EVENT'], description: "Mettez une carte de votre main sur votre deck ou dans votre défausse. Quand vous la piochez ou la recevez du deck, +💰.", expansion: 'plunder' };
export const deliver: CardDefinition = { id: 'deliver', name: 'Livrer', cost: 2, types: ['EVENT'], description: "Recevez une carte coûtant jusqu'à 5 💰. Mettez-la sur votre deck.", expansion: 'plunder' };
export const foray: CardDefinition = { id: 'foray', name: 'Incursion', cost: 3, types: ['EVENT'], description: "Recevez un Butin.", expansion: 'plunder' };
export const invasion: CardDefinition = { id: 'invasion', name: 'Invasion', cost: 10, types: ['EVENT'], description: "Recevez 2 Butins. +1 Achat.", expansion: 'plunder' };
export const journey: CardDefinition = { id: 'journey', name: 'Voyage', cost: 4, types: ['EVENT'], description: "Retournez votre pile de jetons Voyage. Si vous avez fait un voyage complet, +3 Cartes et +1 Action.", expansion: 'plunder' };
export const launch: CardDefinition = { id: 'launch', name: 'Lancer', cost: 3, types: ['EVENT'], description: "Une fois par tour : retournez à votre phase d'Action.", expansion: 'plunder' };
export const looting: CardDefinition = { id: 'looting', name: 'Pillage', cost: 5, types: ['EVENT'], description: "Recevez 2 Butins.", expansion: 'plunder' };
export const maelstrom: CardDefinition = { id: 'maelstrom', name: 'Maelström', cost: 4, types: ['EVENT'], description: "Chaque autre joueur défausse 3 cartes. S'il ne peut pas, il reçoit une Malédiction.", expansion: 'plunder' };
export const mirror: CardDefinition = { id: 'mirror', name: 'Miroir', cost: 3, types: ['EVENT'], description: "Une fois par tour : recevez une copie d'une carte que vous avez reçue ce tour-ci.", expansion: 'plunder' };
export const peril: CardDefinition = { id: 'peril', name: 'Péril', cost: 2, types: ['EVENT'], description: "Écartez n'importe quel nombre de cartes de votre main. Recevez un Butin si vous avez écarté au moins 3 cartes.", expansion: 'plunder' };
export const prepare: CardDefinition = { id: 'prepare', name: 'Préparer', cost: 1, types: ['EVENT'], description: "Mettez une carte de votre main de côté. Au début de votre prochain tour, jouez-la.", expansion: 'plunder' };
export const prosper: CardDefinition = { id: 'prosper', name: 'Prospérer', cost: 5, types: ['EVENT'], description: "Recevez un Butin et +1 Achat.", expansion: 'plunder' };
export const rush: CardDefinition = { id: 'rush', name: 'Précipitation', cost: 2, types: ['EVENT'], description: "Recevez une Action coûtant jusqu'à 4 💰 de la Réserve. Jouez-la.", expansion: 'plunder' };
export const scrounge: CardDefinition = { id: 'scrounge', name: 'Récupérer', cost: 3, types: ['EVENT'], description: "Mettez une Action ou un Trésor de votre défausse sur votre deck.", expansion: 'plunder' };
