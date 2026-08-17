import { CardDefinition } from '../../types/CardDefinition.js';

/**
 * Gladiator (Cost 3💰) - Action
 * +2💰. Reveal a card from your hand. 
 * The player to your left may reveal a copy of it from their hand. 
 * If they don't, +1💰 and you may trash a Gladiator from the Supply.
 */
export const gladiator: CardDefinition = {
    id: 'gladiator',
    name: 'Gladiateur',
    description: "2 💰. Révélez une carte de votre main. Le joueur à votre gauche peut révéler un exemplaire de cette carte de sa main. S'il ne le fait pas, +1 💰 et écartez un Gladiateur de la réserve.",
    cost: 3,
    types: ['ACTION'],
    effects: [
        { type: 'ADD_MONEY', amount: 2 },
        {
            type: 'CHOOSE_FROM_ZONE',
            sourceZone: 'hand',
            message: 'Révélez une carte de votre main',
            min: 0,
            max: 1,
            destination: 'aside',
            onSuccess: [
                // Simplified: Always give +1💰 and option to trash Gladiator
                // Full implementation would need opponent reveal response
                { type: 'ADD_MONEY', amount: 1 },
                {
                    type: 'CHOOSE_OPTION',
                    message: 'Écarter un Gladiateur de la réserve ?',
                    options: [
                        {
                            label: 'Oui',
                            effects: [
                                { type: 'TRASH_FROM_SUPPLY', cardId: 'gladiator' } as any
                            ]
                        },
                        { label: 'Non', effects: [] }
                    ]
                },
                { type: 'MOVE_CARDS', source: 'aside', destination: 'hand', count: 1 }
            ]
        }
    ],
    set: 'empires',
    expansion: 'empires',
    isSubCard: true
};
