import { CardDefinition } from '../../types/CardDefinition';

export const smugglers: CardDefinition = {
    id: 'smugglers',
    name: 'Contrebandier',
    types: ['ACTION'],
    description: 'Gagnez une copie d\'une carte coûtant jusqu\'à 6 Pièces gagnée par le joueur à votre droite lors de son dernier tour.',
    cost: 3,
    set: 'seaside',
    effects: [
        {
            type: 'CHECK_PREVIOUS_TURN',
            query: 'GAINED_CARDS_BY_OPPONENT'
            // This EffectPrimitive handles finding the card and letting user choose one to gain (cost <= 6)
        }
    ]
};
