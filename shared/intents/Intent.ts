
export type IntentType =
    | 'PLAY_CARD'
    | 'BUY_CARD'
    | 'END_TURN'
    | 'END_ACTION_PHASE'
    | 'PLAY_ALL_TREASURES'
    | 'CHOOSE_TOPIC' // For decisions/options
    | 'SELECT_CARDS' // For multi-select from hand/discard
    | 'REORDER_CARDS' // For top-decking
    | 'TRASH_CARD'
    | 'GAIN_CARD' // Debug/Cheat or special events
    | 'SET_READY'
    | 'SUBMIT_DECISION';

export type Intent =
    | { type: 'PLAY_CARD'; payload: { cardId: string; instanceId?: string } }
    | { type: 'BUY_CARD'; payload: { cardId: string } }
    | { type: 'END_TURN'; payload: {} }
    | { type: 'END_ACTION_PHASE'; payload: {} }
    | { type: 'PLAY_ALL_TREASURES'; payload: {} }
    | { type: 'CHOOSE_TOPIC'; payload: { choiceIndex: number; choiceText?: string } }
    | { type: 'SELECT_CARDS'; payload: { cardIds: string[] } }
    | { type: 'REORDER_CARDS'; payload: { cardIds: string[] } } // Ordered list
    | { type: 'SET_READY'; payload: { isReady: boolean } }
    | { type: 'SUBMIT_DECISION'; payload: any }
    | { type: 'RESOLVE_INPUT'; payload: { promptId: string; value: any } };

// Helper to create intents
export const Intents = {
    playCard: (cardId: string, instanceId?: string): Intent => ({ type: 'PLAY_CARD', payload: { cardId, instanceId } }),
    buyCard: (cardId: string): Intent => ({ type: 'BUY_CARD', payload: { cardId } }),
    endTurn: (): Intent => ({ type: 'END_TURN', payload: {} }),
    endActionPhase: (): Intent => ({ type: 'END_ACTION_PHASE', payload: {} }),
    playAllTreasures: (): Intent => ({ type: 'PLAY_ALL_TREASURES', payload: {} }),
    setReady: (isReady: boolean): Intent => ({ type: 'SET_READY', payload: { isReady } })
};
