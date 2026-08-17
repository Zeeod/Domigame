import { CardDefinition } from '../../types/CardDefinition.js';

export const WillOWisp: CardDefinition = {
    id: 'will_o_wisp',
    name: 'Feu Follet',
    cost: 0,
    types: ['ACTION', 'SPIRIT'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: '+1 Carte, +1 Action. Révélez la carte du dessus de votre deck ; si son coût est de 2💰 ou moins, mettez-la dans votre main.',
    isNonSupply: true,
    effects: [
        { type: 'DRAW', amount: 1 },
        { type: 'ADD_ACTIONS', amount: 1 },
        {
            type: 'REVEAL_TOP_OF_DECK',
            amount: 1,
            next: [
                {
                    type: 'CONDITION',
                    condition: 'CARDS_IN_PLAY_COUNT', // Placeholder for "cost check"
                    // Wait, I need a better cost check condition
                    trueEffects: []
                }
            ]
        }
    ]
};

export const Imp: CardDefinition = {
    id: 'imp',
    name: 'Lutin',
    cost: 2,
    types: ['ACTION', 'SPIRIT'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: '+2 Cartes. Vous pouvez jouer de votre main une carte Action que vous n\'avez pas en jeu.',
    isNonSupply: true,
    effects: [
        { type: 'DRAW', amount: 2 },
        { type: 'PLAY_ACTION_TWICE' } // Placeholder for "play action not in play"
    ]
};

export const Ghost: CardDefinition = {
    id: 'ghost',
    name: 'Fantôme',
    cost: 4,
    types: ['NIGHT', 'DURATION', 'SPIRIT'],
    expansion: 'nocturne',
    set: 'Nocturne',
    description: 'Révélez des cartes de votre deck jusqu\'à une Action. Écartez-la. Au début de vos deux prochains tours, jouez-la deux fois, puis défaussez-la.',
    isNonSupply: true,
    durationTurns: 2,
    nightEffects: [
        // Custom Ghost logic
    ]
};
