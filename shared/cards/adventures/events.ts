import { LandscapeDefinition } from '../../types/LandscapeDefinition';

export const alms: LandscapeDefinition = {
    id: 'alms',
    name: 'Aumône',
    types: ['EVENT'],
    cost: { coin: 0 },
    description: "Une fois par tout : si vous n'avez pas de Trésor en jeu, gagnez une carte coûtant jusqu'à 4$.",
    expansion: 'adventures',
    onBuy: [
        {
            type: 'CONDITION',
            condition: 'CARDS_IN_PLAY_COUNT',
            filter: { cardTypes: ['TREASURE'] },
            comparator: '==',
            value: 0,
            trueEffects: [
                { type: 'GAIN_CARD', maxCost: 4, destination: 'discardPile' }
            ]
        }
    ]
};

export const borrow: LandscapeDefinition = {
    id: 'borrow',
    name: 'Emprunt',
    types: ['EVENT'],
    cost: { coin: 0 },
    description: "Une fois par tour : +1 Achat. Si votre pile de défausse ne contient pas de Trésor, +1 pièce. Sinon, défaussez votre pile de défausse pour +1 pièce.",
    expansion: 'adventures',
    onBuy: [
        { type: 'ADD_BUYS', amount: 1 },
        {
            type: 'CONDITION',
            condition: 'DISCARD_COUNT' as any,
            filter: { cardTypes: ['TREASURE'] },
            comparator: '==',
            value: 0,
            trueEffects: [{ type: 'ADD_MONEY', amount: 1 }],
            falseEffects: [
                { type: 'DISCARD_TO_DECK' },
                { type: 'ADD_MONEY', amount: 1 }
            ]
        }
    ]
};

export const save: LandscapeDefinition = {
    id: 'save',
    name: 'Épargne',
    types: ['EVENT'],
    cost: { coin: 1 },
    description: "Une fois par tour : +1 Achat. Écartez une carte de votre main pour la mettre sur votre plateau Taverne (c'est le moment de la récupérer).",
    expansion: 'adventures',
    onBuy: [
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'MOVE_TO_TAVERN_MAT' }
    ]
};

export const pilgrimage: LandscapeDefinition = {
    id: 'pilgrimage',
    name: 'Pèlerinage',
    types: ['EVENT'],
    cost: { coin: 4 },
    description: "Une fois par tour : Choisissez jusqu'à 3 cartes en jeu. Gagnez-en une copie de chaque.",
    expansion: 'adventures',
    onBuy: [
        {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'playArea',
            destination: 'discardPile',
            min: 0,
            max: 3,
            message: "Choisissez jusqu'à 3 cartes en jeu pour en gagner une copie.",
            onSuccess: [
                { type: 'GAIN_COPY_OF_TARGET' }
            ]
        }
    ]
};

export const ball: LandscapeDefinition = {
    id: 'ball',
    name: 'Bal',
    types: ['EVENT'],
    cost: { coin: 5 },
    description: "Prenez votre jeton -1 Pièce. Gagnez 2 cartes coûtant chacune jusqu'à 4$.",
    expansion: 'adventures',
    onBuy: [
        { type: 'MODIFY_TOKEN', token: 'minusCoinToken', value: true } as any,
        { type: 'GAIN_CARD', maxCost: 4, destination: 'discardPile' },
        { type: 'GAIN_CARD', maxCost: 4, destination: 'discardPile' }
    ]
};

export const bonfire: LandscapeDefinition = {
    id: 'bonfire',
    name: 'Feu de joie',
    types: ['EVENT'],
    cost: { coin: 3 },
    description: "Écartez jusqu'à 2 Cuivres que vous avez en jeu.",
    expansion: 'adventures',
    onBuy: [
        {
            type: 'TRASH',
            source: 'playArea',
            min: 0,
            max: 2,
            filter: { cardIds: ['copper'] }
        }
    ]
};

export const expedition: LandscapeDefinition = {
    id: 'expedition',
    name: 'Expédition',
    types: ['EVENT'],
    cost: { coin: 3 },
    description: "Piochez 2 cartes supplémentaires pour votre prochaine main.",
    expansion: 'adventures',
    onBuy: [
        { type: 'MODIFY_TOKEN', token: 'minusCardToken', value: false } as any,
        { type: 'ADD_NEXT_TURN_DRAW', amount: 2 } as any
    ]
};

export const ferry: LandscapeDefinition = {
    id: 'ferry',
    name: 'Bac',
    types: ['EVENT'],
    cost: { coin: 3 },
    description: "Déplacez votre jeton -2 Coût sur une pile de la réserve Action.",
    expansion: 'adventures',
    onBuy: [
        { type: 'MOVE_TOKEN', token: 'minus2Cost', targetType: 'ACTION_PILE' } as any
    ]
};

export const inheritance: LandscapeDefinition = {
    id: 'inheritance',
    name: 'Héritage',
    types: ['EVENT'],
    cost: { coin: 7 },
    description: "Une fois par partie : Mettez de côté une carte Action de votre main coûtant jusqu'à 4$. Placez votre jeton Domaine dessus. Vos Domaines acquièrent les capacités de cette carte.",
    expansion: 'adventures',
    onBuy: [
        { type: 'INHERITANCE_EFFECT' } as any
    ]
};

export const lostArts: LandscapeDefinition = {
    id: 'lost_arts',
    name: 'Arts perdus',
    types: ['EVENT'],
    cost: { coin: 6 },
    description: "Déplacez votre jeton +1 Action sur une pile de la réserve Action.",
    expansion: 'adventures',
    onBuy: [
        { type: 'MOVE_TOKEN', token: 'plus1Action', targetType: 'ACTION_PILE' } as any
    ]
};

export const mission: LandscapeDefinition = {
    id: 'mission',
    name: 'Mission',
    types: ['EVENT'],
    cost: { coin: 4 },
    description: "Jouez un tour supplémentaire après celui-ci (mais pas un 3ème tour consécutif). Durant ce tour, vous ne pouvez pas acheter de cartes.",
    expansion: 'adventures',
    onBuy: [
        { type: 'SCHEDULE_EXTRA_TURN', turnType: 'MISSION' } as any
    ]
};

export const pathfinding: LandscapeDefinition = {
    id: 'pathfinding',
    name: 'Pionnier',
    types: ['EVENT'],
    cost: { coin: 8 },
    description: "Déplacez votre jeton +1 Carte sur une pile de la réserve Action.",
    expansion: 'adventures',
    onBuy: [
        { type: 'MOVE_TOKEN', token: 'plus1Card', targetType: 'ACTION_PILE' } as any
    ]
};

export const plan: LandscapeDefinition = {
    id: 'plan',
    name: 'Plan',
    types: ['EVENT'],
    cost: { coin: 3 },
    description: "Déplacez votre jeton Écart sur une pile de la réserve Action.",
    expansion: 'adventures',
    onBuy: [
        { type: 'MOVE_TOKEN', token: 'trashToken', targetType: 'ACTION_PILE' } as any
    ]
};

export const quest: LandscapeDefinition = {
    id: 'quest',
    name: 'Quête',
    types: ['EVENT'],
    cost: { coin: 0 },
    description: "Vous pouvez défausser une Attaque, deux Malédictions ou 6 cartes. Si vous le faites, gagnez un Or.",
    expansion: 'adventures',
    onBuy: [
        {
            type: 'CHOOSE_OPTION',
            options: [
                { text: 'Défausser une Attaque', effects: [{ type: 'DISCARD', min: 1, max: 1, filter: { cardTypes: ['ATTACK'] } }] },
                { text: 'Défausser 2 Malédictions', effects: [{ type: 'DISCARD', min: 2, max: 2, filter: { cardIds: ['curse'] } }] },
                { text: 'Défausser 6 cartes', effects: [{ type: 'DISCARD', min: 6, max: 6 }] }
            ],
            onSuccess: [{ type: 'GAIN_CARD', cardId: 'gold' }]
        } as any
    ]
};

export const raid: LandscapeDefinition = {
    id: 'raid',
    name: 'Raid',
    types: ['EVENT'],
    cost: { coin: 5 },
    description: "Gagnez un Argent par Argent que vous avez en jeu. Chaque autre joueur prend son jeton -1 Carte et le place sur sa pioche.",
    expansion: 'adventures',
    onBuy: [
        { type: 'ADD_MONEY_PER_CARDS', cardTypes: ['TREASURE'], cardIds: ['silver'], coinsPerCard: 0 } as any,
        { type: 'OTHER_PLAYERS_EFFECT', effects: [{ type: 'MODIFY_TOKEN', token: 'minusCardToken', value: true } as any] }
    ]
};

export const scoutingParty: LandscapeDefinition = {
    id: 'scouting_party',
    name: 'Éclaireurs',
    types: ['EVENT'],
    cost: { coin: 2 },
    description: "+1 Achat. Regardez les 5 cartes du dessus de votre pioche. Défaussez-en 3 et replacez le reste sur le dessus dans l'ordre de votre choix.",
    expansion: 'adventures',
    onBuy: [
        { type: 'ADD_BUYS', amount: 1 },
        {
            type: 'REORDER',
            amount: 5,
            message: 'Choisissez 3 cartes à défausser.',
            onSuccess: [{ type: 'DISCARD', min: 3, max: 3 }]
        } as any
    ]
};

export const seaway: LandscapeDefinition = {
    id: 'seaway',
    name: 'Chenal',
    types: ['EVENT'],
    cost: { coin: 5 },
    description: "+1 Achat. Gagnez une carte Action coûtant jusqu'à 4$. Déplacez votre jeton +1 Achat sur sa pile.",
    expansion: 'adventures',
    onBuy: [
        { type: 'ADD_BUYS', amount: 1 },
        { type: 'GAIN_CARD', maxCost: 4, filter: { cardTypes: ['ACTION'] } },
        { type: 'MOVE_TOKEN', token: 'plus1Buy', targetType: 'ACTION_PILE' } as any
    ]
};

export const trade: LandscapeDefinition = {
    id: 'trade',
    name: 'Commerce',
    types: ['EVENT'],
    cost: { coin: 5 },
    description: "Écartez jusqu'à 2 cartes de votre main. Gagnez un Argent par carte écartée.",
    expansion: 'adventures',
    onBuy: [
        {
            type: 'SELECT_AND_APPLY',
            sourceZone: 'hand',
            min: 0,
            max: 2,
            message: 'Choisissez jusqu\'à 2 cartes à écarter pour gagner un Argent par carte.',
            effects: [{ type: 'TRASH' }],
            onEach: [{ type: 'GAIN_CARD', cardId: 'silver' }]
        } as any
    ]
};

export const training: LandscapeDefinition = {
    id: 'training',
    name: 'Entraînement',
    types: ['EVENT'],
    cost: { coin: 6 },
    description: "Déplacez votre jeton +1 pièce sur une pile de la réserve Action.",
    expansion: 'adventures',
    onBuy: [
        { type: 'MOVE_TOKEN', token: 'plus1Coin', targetType: 'ACTION_PILE' } as any
    ]
};

export const travellingFair: LandscapeDefinition = {
    id: 'travelling_fair',
    name: 'Foire itinérante',
    types: ['EVENT'],
    cost: { coin: 2 },
    description: "+2 Achats. Pour le reste de ce tour, lorsque vous gagnez une carte, vous pouvez la placer sur votre pioche.",
    expansion: 'adventures',
    onBuy: [
        { type: 'ADD_BUYS', amount: 2 },
        { type: 'ADD_POST_GAIN_EFFECT', effect: { type: 'MOVE_TO_POSITION', position: 0 } } as any
    ]
};
