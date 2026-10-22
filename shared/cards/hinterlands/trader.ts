import { CardDefinition } from '../../types/CardDefinition.js';

export const trader: CardDefinition = {
    id: 'trader',
    name: 'Commerçant',
    types: ['ACTION', 'REACTION'],
    cost: 4,
    expansion: 'hinterlands',
    description: 'Écartez une carte de votre main. Recevez un Argent par 💰 de son coût. Quand vous recevez une carte, vous pouvez dévoiler cette carte de votre main pour échanger la carte reçue contre un Argent.',
    effects: [
        { type: 'TRASH', min: 1, max: 1, from: 'hand', message: 'Commerçant : écartez une carte', onSuccess: [{ type: 'TRADER_SILVERS' }] }
    ] as any,
    reactionEffects: [{ type: 'EXCHANGE_GAINED_FOR_SILVER' }] as any,
    reactionTrigger: 'GAIN' as any
};
