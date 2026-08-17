import { CardDefinition } from '../../types/CardDefinition';

export const seaChart: CardDefinition = {
    id: 'sea_chart',
    name: 'Carte marine',
    types: ['ACTION'],
    cost: 3,
    description: '+1 Carte ; +1 Action. Révélez la carte du dessus de votre pioche. Si vous avez un exemplaire de cette carte en jeu, ajoutez-la à votre main.',
    set: 'seaside',
    effects: [
        {
            type: 'DRAW',
            amount: 1
        },
        {
            type: 'ADD_ACTIONS',
            amount: 1
        },
        {
            type: 'REVEAL_CARDS',
            source: 'deck',
            amount: 1,
            destination: 'limbo'
        },
        {
            type: 'SEA_CHART_CHECK'
        }
    ]
};
