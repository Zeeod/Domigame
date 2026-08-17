import { CardDefinition } from '../../types/CardDefinition.js';

export const doctor: CardDefinition = {
    id: 'doctor',
    name: 'Médecin',
    types: ['ACTION'],
    cost: 3,
    expansion: 'guilds',
    set: 'guilds',
    description: 'Nommez une carte. Révélez les 3 cartes du dessus de votre pioche. Écartez les copies nommées. Remettez les autres dans l\'ordre de votre choix. Surprix: Regardez autant de cartes, écartez/défaussez/remettez chacune.',
    effects: [
        { type: 'NAME_A_CARD' },
        {
            type: 'REVEAL_CARDS',
            amount: 3,
            source: 'deck',
            destination: 'aside'
        },
        { type: 'TRASH_NAMED_CARDS' },
        { type: 'REORDER_AND_RETURN', destination: 'deck' }
    ] as any
};
