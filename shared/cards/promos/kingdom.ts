import { CardDefinition } from '../../types/CardDefinition.js';

export const envoy: CardDefinition = {
    id: 'envoy',
    name: 'Délégué',
    cost: 4,
    types: ['ACTION'],
    description: "Révélez les 5 premières cartes de votre pioche. L'adversaire à votre gauche choisit l'une d'entre elles que vous défaussez. Prenez les autres en main.",
    effects: [
        { type: 'REVEAL_CARDS', amount: 5, source: 'deck', destination: 'limbo' },
        // The player to your left picks one to discard; the rest go to your hand
        { type: 'OPPONENT_CHOOSES_DISCARD', count: 1, restTo: 'hand' } as any
    ],
    expansion: 'promos'
};

export const prince: CardDefinition = {
    id: 'prince',
    name: 'Prince',
    cost: 8,
    types: ['ACTION'],
    description: "Vous pouvez mettre cette carte de côté. Dans ce cas, mettez de côté une carte Action de votre main coûtant jusqu'à 4 💰. Au début de chacun de vos tours, jouez cette Action, en la remettant de côté quand vous la défaussez de votre zone de jeu.",
    effects: [{ type: 'PRINCE' } as any],
    expansion: 'promos'
};

// Summon will be moved to events.ts as it is an Event card.

export const dismantle: CardDefinition = {
    id: 'dismantle',
    name: 'Démantèlement',
    cost: 4,
    types: ['ACTION'],
    description: "Écartez une carte de votre main. Si elle coûte 1 💰 ou plus, recevez une carte moins chère et un Or.",
    effects: [
        { type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Démantèlement : écartez une carte', onSuccess: [{ type: 'DISMANTLE' }] }
    ] as any,
    expansion: 'promos'
};

export const captain: CardDefinition = {
    id: 'captain',
    name: 'Capitaine',
    cost: 6,
    types: ['ACTION', 'DURATION', 'COMMAND'],
    description: "Maintenant et au début de votre prochain tour : jouez une carte Action de la réserve coûtant jusqu'à 4 💰 qui n'est ni une Durée ni un Ordre, en la laissant là.",
    effects: [{ type: 'PLAY_FROM_SUPPLY', maxCost: 4 } as any],
    durationEffects: [{ type: 'PLAY_FROM_SUPPLY', maxCost: 4 } as any],
    expansion: 'promos'
};

export const church: CardDefinition = {
    id: 'church',
    name: 'Église',
    cost: 3,
    types: ['ACTION', 'DURATION'],
    description: "+1 Action. Mettez de côté face cachée jusqu'à 3 cartes de votre main. Au début de votre prochain tour, prenez-les en main, puis vous pouvez écarter une carte de votre main.",
    effects: [{ type: 'ADD_ACTIONS', amount: 1 }, { type: 'CHURCH' }] as any,
    durationEffects: [{ type: 'CHURCH_RETURN' }] as any,
    expansion: 'promos'
};

export const marchland: CardDefinition = {
    id: 'marchland',
    name: 'Frontière',
    cost: 5,
    types: ['VICTORY'],
    description: "Vaut 1 PV par tranche de 3 cartes Victoire que vous possédez (arrondi à l'inférieur). Quand vous recevez cette carte, +1 Achat, et vous pouvez défausser autant de cartes que vous voulez pour +1 💰 chacune.",
    dynamicVP: true,
    vpCalculator: (allCards, getDef) => Math.floor(allCards.filter((c: any) => getDef(c.id)?.types.includes('VICTORY')).length / 3),
    effects: [],
    onGain: [{ type: 'MARCHLAND_ON_GAIN' }] as any,
    expansion: 'promos'
};

export const black_market: CardDefinition = {
    id: 'black_market',
    name: 'Marché Noir',
    cost: 3,
    types: ['ACTION'],
    description: "+2 💰. Révélez les 3 cartes du dessus de la pioche du Marché Noir. Vous pouvez en acheter une immédiatement. Remettez les autres sous la pioche du Marché Noir.",
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        { type: 'BLACK_MARKET' } as any
    ],
    expansion: 'promos'
};

export const stash: CardDefinition = {
    id: 'stash',
    name: 'Cachette',
    cost: 5,
    types: ['TREASURE'],
    description: "2 💰. Quand vous mélangez, vous pouvez placer cette carte n'importe où dans votre pioche (elle est placée sur le dessus).",
    treasureValue: 2,
    effects: [{ type: 'ADD_MONEY', amount: 2 }],
    expansion: 'promos'
};

export const walled_village: CardDefinition = {
    id: 'walled_village',
    name: 'Village fortifié',
    cost: 4,
    types: ['ACTION'],
    description: "+1 Carte, +2 Actions. Au début de l'Ajustement, si vous avez cette carte et au plus une autre carte Action en jeu, vous pouvez placer cette carte sur votre pioche.",
    effects: [{ type: 'DRAW', amount: 1 }, { type: 'ADD_ACTIONS', amount: 2 }],
    onCleanup: [{ type: 'WALLED_VILLAGE' }] as any,
    expansion: 'promos'
};

export const governor: CardDefinition = {
    id: 'governor',
    name: 'Gouverneur',
    cost: 5,
    types: ['ACTION'],
    description: "+1 Action. Choisissez ; vous obtenez la version entre parenthèses : chaque joueur pioche 1 (3) carte(s) ; ou chaque joueur reçoit un Argent (un Or) ; ou chaque joueur peut écarter une carte de sa main et recevoir une carte coûtant exactement 1 💰 (2 💰) de plus.",
    effects: [{ type: 'ADD_ACTIONS', amount: 1 }, { type: 'GOVERNOR' }] as any,
    expansion: 'promos'
};
