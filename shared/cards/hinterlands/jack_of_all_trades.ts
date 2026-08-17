import { CardDefinition } from '../../types/CardDefinition.js';

export const jackOfAllTrades: CardDefinition = {
    id: 'jack_of_all_trades',
    name: 'Touche-à-tout',
    types: ['ACTION'],
    cost: 4,
    expansion: 'hinterlands',
    set: 'hinterlands',
    description: 'Gagnez un Argent. Regardez la carte du dessus de votre pioche; défaussez-la ou replacez-la. Piochez jusqu\'à avoir 5 cartes en main. Vous pouvez écarter une carte non-Trésor de votre main.',
    effects: [
        { type: 'GAIN_CARD', cardId: 'silver', destination: 'discardPile' },
        {
            type: 'PEEK_TOP_DECK',
            amount: 1,
            message: 'Que faire de la carte du dessus ?',
            options: [
                { label: 'Défausser', effects: [{ type: 'DISCARD_TOP_DECK' }] },
                { label: 'Replacer', effects: [] }
            ]
        } as any,
        { type: 'DRAW_UNTIL_HAND_SIZE', targetSize: 5 },
        {
            type: 'TRASH',
            min: 0,
            max: 1,
            from: 'hand',
            filter: { excludeTypes: ['TREASURE'] },
            message: 'Vous pouvez écarter une carte non-Trésor'
        }
    ]
};
