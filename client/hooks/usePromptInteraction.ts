import { useCallback } from 'react';
import { Prompt } from '../../shared/engine/prompts/Prompt';
import { CardInteraction } from '../types/Interaction';

// Note: Selection state is now managed via PlayerState.currentSelection (Server)
// This hook calculates interaction states derived from that prop.

export function usePromptInteraction(
    prompt: Prompt | undefined,
    currentSelection: string[] | undefined,
    onUpdateSelection: (ids: string[]) => void
) {
    const selectedIds = currentSelection || [];

    const toggleCard = useCallback((cardId: string) => {
        if (!prompt) return;

        const isSelected = selectedIds.includes(cardId);
        let newIds = [...selectedIds];

        if (isSelected) {
            newIds = newIds.filter(id => id !== cardId);
        } else {
            // Check Max Constraint
            const max = prompt.constraints?.max;
            if (max === 1) {
                // Single select mode: replace
                newIds = [cardId];
            } else {
                if (newIds.length < max) {
                    newIds.push(cardId);
                }
            }
        }

        // Dispatch update to server
        onUpdateSelection(newIds);
    }, [prompt, selectedIds, onUpdateSelection]);

    const getCardInteraction = useCallback((cardId: string, zone: string): CardInteraction => {
        if (!prompt) {
            return { selectable: false, selected: false, disabled: false };
        }

        // 1. Zone Check
        const constraints = prompt.constraints || {};
        const sourceZones = constraints.sourceZone
            ? (Array.isArray(constraints.sourceZone) ? constraints.sourceZone : [constraints.sourceZone])
            : ['HAND']; // Default

        // Use loose check for zones (e.g. 'hand' vs 'HAND')
        if (!sourceZones.some(z => z.toLowerCase() === zone.toLowerCase())) {
            return { selectable: false, selected: false, disabled: true };
        }

        // 2. Allowed IDs Check (if present)
        if (constraints.allowedCardIds && !constraints.allowedCardIds.includes(cardId)) {
            return { selectable: false, selected: false, disabled: true };
        }

        const isSelected = selectedIds.includes(cardId);
        const count = selectedIds.length;
        const max = constraints.max;

        // 3. Max reached check (if not selected, and max reached)
        // If max is 1, we allow switching, so it is selectable.
        // If max > 1, and limit reached, unselected cards are disabled/unselectable.
        let disabled = false;
        if (!isSelected && max > 1 && count >= max) {
            disabled = true;
        }

        return {
            selectable: !disabled,
            selected: isSelected,
            disabled
        };

    }, [prompt, selectedIds]);

    const isValid = (() => {
        if (!prompt) return false;
        const count = selectedIds.length;
        return count >= (prompt.constraints?.min || 0) && (prompt.constraints?.max === undefined || count <= prompt.constraints?.max);
    })();

    return {
        selection: { selectedIds },
        toggleCard,
        getCardInteraction,
        isValid
    };
}
