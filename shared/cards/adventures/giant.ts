import { CardDefinition } from '../../types/CardDefinition.js';

export const giant: CardDefinition = {
    id: 'giant',
    name: 'Géant',
    types: ['ACTION', 'ATTACK'],
    cost: 5,
    expansion: 'adventures',
    description: 'Retournez votre jeton Voyage (il commence face visible). S\'il est face cachée, +1 💰. S\'il est face visible, +5 💰, et chaque autre joueur dévoile la carte du dessus de sa pioche, l\'écarte si elle coûte de 3 à 6 💰, et sinon la défausse et reçoit une Malédiction.',
    effects: [{
        type: 'FLIP_JOURNEY_TOKEN',
        onFaceDown: [{ type: 'ADD_MONEY', amount: 1 }],
        onFaceUp: [{ type: 'ADD_MONEY', amount: 5 }, { type: 'ATTACK', attackEffects: [{ type: 'GIANT_ATTACK' }] }]
    }] as any
};
