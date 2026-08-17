import { CardDefinition } from '../../types/CardDefinition';

export const lookout: CardDefinition = {
    id: 'lookout',
    name: 'Vigie',
    types: ['ACTION'],
    description: '+1 Action. Regardez les 3 cartes du dessus de votre pioche. Écartez-en une, défaussez-en une et replacez la dernière sur la pioche.',
    cost: 3,
    set: 'seaside',
    effects: [
        { type: 'ADD_ACTIONS', amount: 1 },
        // "Look at the top 3 cards of your deck. Trash one, discard one, put one on top."
        // This is complex. We can use REVEAL_CARDS then SELECT_AND_APPLY logic?
        // EffectEngine doesn't have a "trash one, discard one..." single primitive.
        // We can use a sequence of prompts.
        // 1. Draw 3 to Limbo/Aside.
        // 2. Prompt Trash 1.
        // 3. Prompt Discard 1.
        // 4. Put remaining on Top.

        // We can use 'MOVE_CARDS' to bring 3 to Aside.
        { type: 'MOVE_CARDS', source: 'deck', destination: 'aside', count: 3 },
        {
            type: 'SELECT_AND_APPLY',
            sourceZone: 'aside',
            min: 1, max: 1,
            message: 'Choisissez une carte à ÉCARTER',
            action: 'TRASH'
        },
        {
            type: 'SELECT_AND_APPLY',
            sourceZone: 'aside',
            min: 1, max: 1,
            message: 'Choisissez une carte à DÉFAUSSER',
            action: 'DISCARD'
        },
        {
            type: 'MOVE_CARDS',
            source: 'aside',
            destination: 'deck',
            count: 1 // Only 1 should be left
        }
    ]
};
