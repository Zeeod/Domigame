export type InteractionMode = 'IDLE' | 'PROMPT_SELECTION' | 'PROMPT_CONFIRM';

export interface SelectionState {
    selectedIds: string[];
}

export interface CardInteraction {
    selectable: boolean; // Can be clicked?
    selected: boolean;   // Is currently selected?
    disabled: boolean;   // Is explicitly disabled (dimmed)?
}
