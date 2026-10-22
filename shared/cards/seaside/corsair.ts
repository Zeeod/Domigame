import { CardDefinition } from '../../types/CardDefinition';

export const corsair: CardDefinition = {
    id: 'corsair',
    name: 'Corsaire',
    types: ['ACTION', 'DURATION', 'ATTACK'],
    cost: 5,
    description: '+2 Pièces. Au début de votre prochain tour : +1 Pièce. Chaque autre joueur dévoile la carte du sommet de sa pioche, écarte un Argent ou un Or dévoilé et défausse le reste. Jusqu\'à votre prochain tour, chaque autre joueur écarte le premier Argent ou Or qu\'il joue à son tour.',
    expansion: 'seaside',
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        {
            // Until your next turn, each other player trashes the first Silver or Gold they play each turn
            type: 'ATTACK',
            attackEffects: [{
                type: 'REGISTER_TRIGGER', trigger: 'ON_PLAY',
                filter: { cardIds: ['silver', 'gold'], firstPerTurn: 'corsair' },
                effects: [{ type: 'TRASH_PLAYED_CARD' }],
                expiresOnTurnOf: 'ATTACKER', repeat: true,
                description: 'Corsaire : écarte le premier Argent ou Or joué'
            }]
        }
    ] as any,
    durationEffects: [
        { type: 'DRAW', amount: 1 }
    ]
};
