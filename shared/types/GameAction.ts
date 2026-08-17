/**
 * GameAction - All possible player actions
 * 
 * All player interactions MUST be expressed through these actions.
 * This is the ONLY way for clients to interact with the game.
 */

// ============================================================================
// Action Union Type
// ============================================================================

export type GameAction =
    | PlayCardAction
    | BuyCardAction
    | PlayAllTreasuresAction
    | EndPhaseAction
    | ChooseAction
    | ToggleReadyAction
    | ToggleReadyAction
    | AcknowledgeRevealAction
    | UpdateSelectionAction
    | PayDebtAction
    | SpendCoffersAction
    | SpendVillagersAction
    | BuyProjectAction
    | ActivateLandscapeAction
    | BuyLandscapeAction;

export interface BuyLandscapeAction {
    type: 'BUY_LANDSCAPE';
    landscapeId: string;
}

// ============================================================================
// Action Types
// ============================================================================

export interface PlayCardAction {
    type: 'PLAY_CARD';
    /** The instance ID of the card to play */
    cardInstanceId: string;
    wayId?: string;
}

export interface BuyCardAction {
    type: 'BUY_CARD';
    /** The card definition ID to buy */
    cardId: string;
}

export interface ActivateLandscapeAction {
    type: 'ACTIVATE_LANDSCAPE';
    landscapeId: string;
}

export interface BuyProjectAction {
    type: 'BUY_PROJECT';
    projectId: string;
}

export interface PlayAllTreasuresAction {
    type: 'PLAY_ALL_TREASURES';
}

export interface EndPhaseAction {
    type: 'END_PHASE';
}

export interface ChooseAction {
    type: 'CHOOSE';
    /** The choice ID being responded to */
    choiceId: string;
    /** The response payload */
    payload: ChoosePayload;
}

export interface ToggleReadyAction {
    type: 'TOGGLE_READY';
}

export interface AcknowledgeRevealAction {
    type: 'ACKNOWLEDGE_REVEAL';
}

export interface UpdateSelectionAction {
    type: 'UPDATE_SELECTION';
    selectedIds: string[];
}

export interface PayDebtAction {
    type: 'PAY_DEBT';
    /** Amount of debt to pay. Must be <= player.coins and <= player.debt */
    amount: number;
}

export interface SpendCoffersAction {
    type: 'SPEND_COFFERS';
    amount?: number; // Default 1
}

export interface SpendVillagersAction {
    type: 'SPEND_VILLAGERS';
    amount?: number; // Default 1
}

// ============================================================================
// Choose Payloads
// ============================================================================

export type ChoosePayload =
    | { type: 'CARDS'; cardInstanceIds: string[] }
    | { type: 'SUPPLY'; cardId: string }
    | { type: 'OPTION'; optionIndex?: number; choice?: string }  // Flexible for legacy/YES_NO
    | { type: 'OPTIONS'; optionIndices: number[] } // New: Multi-select
    | { type: 'CONFIRM' }
    | { type: 'PASS' };

// ============================================================================
// Factory Functions
// ============================================================================

export function playCard(cardInstanceId: string): PlayCardAction {
    return { type: 'PLAY_CARD', cardInstanceId };
}

export function buyCard(cardId: string): BuyCardAction {
    return { type: 'BUY_CARD', cardId };
}

export function playAllTreasures(): PlayAllTreasuresAction {
    return { type: 'PLAY_ALL_TREASURES' };
}

export function endPhase(): EndPhaseAction {
    return { type: 'END_PHASE' };
}

export function choose(choiceId: string, payload: ChoosePayload): ChooseAction {
    return { type: 'CHOOSE', choiceId, payload };
}

export function toggleReady(): ToggleReadyAction {
    return { type: 'TOGGLE_READY' };
}

export function updateSelection(selectedIds: string[]): UpdateSelectionAction {
    return { type: 'UPDATE_SELECTION', selectedIds };
}
export function payDebt(amount: number): PayDebtAction {
    return { type: 'PAY_DEBT', amount };
}
export function spendCoffers(amount: number = 1): SpendCoffersAction {
    return { type: 'SPEND_COFFERS', amount };
}
export function spendVillagers(amount: number = 1): SpendVillagersAction {
    return { type: 'SPEND_VILLAGERS', amount };
}
