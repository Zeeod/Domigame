import { CardDefinition } from '../../types/CardDefinition';

export const pirate: CardDefinition = {
    id: 'pirate',
    name: 'Pirate',
    types: ['ACTION', 'DURATION', 'REACTION'],
    cost: 5,
    description: 'Au début de votre prochain tour, gagnez une carte Trésor coûtant jusqu\'à 6 Pièces dans votre main. Réaction : Lorsqu\'un autre joueur gagne une carte Trésor, vous pouvez jouer cette carte de votre main.',
    set: 'seaside',
    effects: [
        // No immediate effect unless played via Reaction or Action phase.
        // If played, it sets up the Duration.
        // Reaction logic is handled by the engine checking triggers.
    ],
    durationEffects: [
        {
            type: 'GAIN_CARD',
            destination: 'hand',
            maxCost: 6
            // types: ['TREASURE'] // Logic must be handled by engine tracking allowed types for specific cards or trusted user.
        }
    ]
};
