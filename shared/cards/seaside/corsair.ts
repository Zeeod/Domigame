import { CardDefinition } from '../../types/CardDefinition';

export const corsair: CardDefinition = {
    id: 'corsair',
    name: 'Corsaire',
    types: ['ACTION', 'DURATION', 'ATTACK'],
    cost: 5,
    description: '+2 Pièces. Au début de votre prochain tour : +1 Pièce. Chaque autre joueur dévoile la carte du sommet de sa pioche, écarte un Argent ou un Or dévoilé et défausse le reste. Jusqu\'à votre prochain tour, chaque autre joueur écarte le premier Argent ou Or qu\'il joue à son tour.',
    set: 'seaside',
    effects: [
        {
            type: 'ADD_MONEY',
            amount: 2
        },
        {
            type: 'ATTACK',
            attackEffects: [
                {
                    type: 'REVEAL_CARDS',
                    source: 'deck',
                    amount: 1,
                    destination: 'limbo'
                },
                {
                    type: 'ADD_ACTIONS', // Placeholder for trash from limbo
                    amount: 0
                    // Logic handled by engine via card ID: CORSAIR_ATTACK_TRASH
                }
            ]
        },
        {
            type: 'ADD_ACTIONS',
            amount: 0
            // Logic handled by engine via card ID: SETUP_REACTION_OPPONENT_PLAYS_TREASURE
        }
    ],
    durationEffects: [
        {
            type: 'ADD_MONEY',
            amount: 1
        }
    ]
};
