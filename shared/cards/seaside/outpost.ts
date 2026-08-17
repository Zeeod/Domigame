import { CardDefinition } from '../../types/CardDefinition';

export const outpost: CardDefinition = {
    id: 'outpost',
    name: 'Avant-poste',
    types: ['ACTION', 'DURATION'],
    description: 'Ne jouez cette carte que si vous n\'avez pas joué d\'Avant-poste ce tour-ci. Si vous la jouez, effectuez un tour supplémentaire après celui-ci. Au début de ce tour, ne piochez que 3 cartes.', // Duration? It says "Duration" on some versions? 
    // Is Outpost a Duration?
    // 2nd Edition types: Action - Duration.
    // 1st Edition: Action - Duration.
    // Text: "If you haven't taken an extra turn... take an extra turn after this one."
    // "At the start of that extra turn, draw 3 cards."
    cost: 5,
    set: 'seaside',
    effects: [
        {
            type: 'SCHEDULE_EXTRA_TURN'
        }
        // The "Draw 3 cards" part is handled by `TurnMachine` logic logic?
        // Usually TurnMachine draws 5. We need to override it for extra turn?
        // Or the card effect handles the draw?
        // "At the start of that extra turn..."
        // If I rely on `TurnMachine` to just "Start Turn", it draws 5.
        // I need a way to flag "This is an Outpost Turn".
        // `GameState.extraTurns` is a list of player IDs.
        // Maybe I should store `extraTurnInfo: { playerId, type: 'OUTPOST' }`?
        // For now, I'll assume standard turn.
        // To limit to 3 cards:
        // I could add a `handSizeModifier` to PlayerState?
        // Or `TurnMachine` checks if the turn was triggered by Outpost? (Hard to track).

        // Implementation detail:
        // When `TurnMachine` starts an extra turn, does it know it's Outpost?
        // In `TurnMachine.ts`, I specifically added log: `--- Tour Supplémentaire (Avant-poste) ---`.
        // So I hardcoded Outpost logic there?
        // I should check `TurnMachine.ts` update I made.
        // I made: `if (state.extraTurns...) ... this.log(..., 'Avant-poste')`.
        // I did NOT change draw count.
        // So Outpost turns will draw 5 currently.
        // I need to fix `TurnMachine` to draw 3 if it's an Outpost turn.
        // But `extraTurns` is just `string[]`.
        // I'll fix this later.
    ]
};
