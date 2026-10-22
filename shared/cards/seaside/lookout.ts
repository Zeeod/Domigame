import { CardDefinition } from '../../types/CardDefinition';

export const lookout: CardDefinition = {
    id: 'lookout',
    name: 'Vigie',
    types: ['ACTION'],
    description: '+1 Action. Regardez les 3 cartes du dessus de votre pioche. Écartez-en une, défaussez-en une et replacez la dernière sur la pioche.',
    cost: 3,
    expansion: 'seaside',
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        { type: 'REVEAL_CARDS', amount: 3, source: 'deck', destination: 'limbo', private: true },
        { type: 'SELECT_AND_APPLY', sourceZone: 'limbo', min: 1, max: 1, message: 'Vigie : écartez une de ces cartes', action: 'TRASH' },
        { type: 'SELECT_AND_APPLY', sourceZone: 'limbo', min: 1, max: 1, message: 'Vigie : défaussez une de ces cartes', action: 'DISCARD' },
        { type: 'MOVE_CARDS', source: 'limbo', destination: 'deck', position: 'TOP', count: 'ALL' }
    ] as any
};
