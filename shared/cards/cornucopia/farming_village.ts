import { CardDefinition } from '../../types/CardDefinition.js';

export const farmingVillage: CardDefinition = {
    id: 'farming_village',
    name: 'Ferme collective',
    types: ['ACTION'],
    cost: 4,
    expansion: 'cornucopia',
    set: 'cornucopia',
    description: '+2 Actions. Révélez des cartes du dessus de votre pioche jusqu\'à révéler une carte Action ou Trésor. Prenez-la en main. Défaussez les autres.',
    effects: [
        { type: 'ADD_ACTIONS', amount: 2 },
        { type: 'REVEAL_UNTIL', types: ['ACTION', 'TREASURE'], destination: 'hand' }
    ] as any
};
