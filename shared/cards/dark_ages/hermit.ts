import { CardDefinition } from '../../types/CardDefinition.js';

export const hermit: CardDefinition = {
    id: 'hermit',
    name: 'Ermite',
    cost: 3,
    types: ['ACTION'],
    expansion: 'Dark Ages',
    set: 'Dark Ages',
    description: 'Regardez votre défausse. Vous pouvez écarter une carte non-Trésor de votre défausse ou main. Gagnez une carte coûtant jusqu\'à 3💰. Quand vous défaussez cette carte en phase Précédent les achats, si vous n\'avez rien acheté ce tour, écartez-la et gagnez un Fou.',
    effects: [
        { type: 'MAY_TRASH_NON_TREASURE', from: 'discard_or_hand' } as any,
        { type: 'GAIN_CARD', maxCost: 3, destination: 'discardPile' }
    ]
};
