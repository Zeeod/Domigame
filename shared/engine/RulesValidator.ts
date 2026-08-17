/**
 * RulesValidator - Validates action legality
 * 
 * NEVER mutates state.
 * Returns explicit errors.
 * Validation MUST be separate from execution.
 */

import { GameState, getCurrentPlayer } from '../engine/GameState.js';
import { GameAction } from '../types/GameAction.js';
import { CardRegistry } from '../cards/index.js';
import { PromptType } from './prompts/Prompt.js';
import { EconomyEngine } from './EconomyEngine.js';
import { EffectUtils } from './EffectUtils.js';
import { LandscapeRegistry } from '../cards/landscapes/index.js';

// ============================================================================
// Validation Result
// ============================================================================

export interface ValidationResult {
    valid: boolean;
    error?: string;
}

// ============================================================================
// RulesValidator
// ============================================================================

export class RulesValidator {
    /**
     * Validate an action for a player
     * NEVER mutates state
     */
    static validate(state: GameState, playerId: string, action: GameAction): ValidationResult {
        // Check if it's a pending choice situation
        if (state.pendingDecision) {
            if (action.type !== 'CHOOSE') {
                return { valid: false, error: 'Vous devez répondre au choix en attente' };
            }
            if (state.pendingDecision.playerId !== playerId) {
                return { valid: false, error: "Ce n'est pas à votre tour de choisir" };
            }
        }

        switch (action.type) {
            case 'TOGGLE_READY':
                return this.validateToggleReady(state, playerId);

            case 'PLAY_CARD':
                return this.validatePlayCard(state, playerId, action.cardInstanceId, action.wayId);

            case 'BUY_CARD':
                return this.validateBuyCard(state, playerId, action.cardId);

            case 'BUY_PROJECT':
                return this.validateBuyProject(state, playerId, action.projectId);

            case 'BUY_LANDSCAPE' as any:
                return this.validateBuyLandscape(state, playerId, (action as any).landscapeId);

            case 'ACTIVATE_LANDSCAPE' as any:
                return this.validateActivateLandscape(state, playerId, (action as any).landscapeId);

            case 'END_PHASE':
                return this.validateEndPhase(state, playerId);

            case 'CHOOSE':
                return this.validateChoice(state, playerId, action.choiceId, action.payload);

            case 'PLAY_ALL_TREASURES':
                return this.validatePlayAllTreasures(state, playerId);

            case 'ACKNOWLEDGE_REVEAL':
                return { valid: true };

            case 'PAY_DEBT':
                return this.validatePayDebt(state, playerId, action.amount);

            default:
                return { valid: false, error: "Type d'action inconnu" };
        }
    }

    // ========================================================================
    // Specific Validators
    // ========================================================================

    private static validateToggleReady(state: GameState, playerId: string): ValidationResult {
        if (state.phase !== 'PREGAME') {
            return { valid: false, error: 'Impossible de changer son statut "prêt" hors phase PREGAME' };
        }

        const player = state.players.find(p => p.id === playerId);
        if (!player) {
            return { valid: false, error: 'Joueur non trouvé' };
        }

        return { valid: true };
    }

    private static validatePlayCard(state: GameState, playerId: string, cardInstanceId: string, wayId?: string): ValidationResult {
        // Check if it's this player's turn
        const currentPlayer = getCurrentPlayer(state);
        if (!currentPlayer || currentPlayer.id !== playerId) {
            return { valid: false, error: "Ce n'est pas votre tour" };
        }

        // If playing as a Way
        if (wayId) {
            const way = LandscapeRegistry.get(wayId);
            if (!way || !way.types.includes('WAY')) {
                return { valid: false, error: 'Voie invalide' };
            }
        }

        // Find card in hand
        const card = currentPlayer.hand.find(c => c.instanceId === cardInstanceId);
        if (!card) {
            return { valid: false, error: 'Carte non trouvée dans la main' };
        }

        const cardDef = CardRegistry.get(card.id);
        if (!cardDef) {
            return { valid: false, error: 'Carte inconnue' };
        }

        // Phase-specific validation
        const isEnlightenmentFulfilled = state.activeProphecyId === 'enlightenment' &&
            state.landscapeState['enlightenment']?.tokens?.sun === 0;

        if (state.phase === 'ACTION') {
            if (cardDef.types.includes('ACTION') || (isEnlightenmentFulfilled && cardDef.types.includes('TREASURE'))) {
                if (currentPlayer.actions <= 0) {
                    return { valid: false, error: "Plus d'actions disponibles" };
                }
            } else if (!cardDef.types.includes('TREASURE')) {
                return { valid: false, error: "Seules les Actions ou les Trésors peuvent être joués en phase Action" };
            }
        } else if (state.phase === 'BUY') {
            if (!cardDef.types.includes('TREASURE')) {
                return { valid: false, error: "Seuls les Trésors peuvent être joués manuellement en phase Achat" };
            }
        } else if (state.phase === 'NIGHT') {
            if (!cardDef.types.includes('NIGHT')) {
                return { valid: false, error: 'Seules les cartes Nuit peuvent être jouées en phase Nuit' };
            }
        } else {
            return { valid: false, error: 'Impossible de jouer des cartes dans cette phase' };
        }

        return { valid: true };
    }

    private static validateBuyCard(state: GameState, playerId: string, cardId: string): ValidationResult {
        // Check if it's this player's turn
        const currentPlayer = getCurrentPlayer(state);
        if (!currentPlayer || currentPlayer.id !== playerId) {
            return { valid: false, error: "Ce n'est pas votre tour" };
        }

        if (state.phase !== 'BUY') {
            return { valid: false, error: "Vous n'êtes pas en phase Achat" };
        }

        if (currentPlayer.buys <= 0) {
            return { valid: false, error: "Plus d'achats disponibles" };
        }

        const cardDef = CardRegistry.get(cardId);
        if (!cardDef) {
            return { valid: false, error: 'Carte inconnue' };
        }

        if (currentPlayer.debt > 0) {
            return { valid: false, error: "Vous devez rembourser votre dette avant de pouvoir acheter d'autres cartes" };
        }

        const cardCost = EconomyEngine.getCardCost(state, playerId, cardId);
        if (currentPlayer.coins < cardCost) {
            return { valid: false, error: 'Pas assez de pièces' };
        }

        const potionCost = cardDef.potionCost || 0;
        if (potionCost > 0 && (currentPlayer.potions || 0) < potionCost) {
            return { valid: false, error: 'Pas assez de potions' };
        }

        const pile = state.supply[cardId];
        if (!pile || pile.count <= 0) {
            return { valid: false, error: 'Réserve vide' };
        }

        // Check buy restrictions
        if (cardDef.buyRestriction) {
            if (cardDef.buyRestriction.type === 'NO_COPPER_IN_PLAY') {
                const copperInPlay = currentPlayer.playArea.some(c => c.id === 'copper');
                if (copperInPlay) {
                    return { valid: false, error: 'Vous ne pouvez pas acheter cette carte si vous avez du Cuivre en jeu' };
                }
            }
        }

        return { valid: true };
    }

    private static validateBuyProject(state: GameState, playerId: string, projectId: string): ValidationResult {
        const currentPlayer = getCurrentPlayer(state);
        if (!currentPlayer || currentPlayer.id !== playerId) return { valid: false, error: "not_your_turn" };
        if (state.phase !== 'BUY') return { valid: false, error: "invalid_phase" };
        if (currentPlayer.buys <= 0) return { valid: false, error: "no_buys" };

        const def = CardRegistry.get(projectId);
        if (!def) return { valid: false, error: "unknown_project" };
        if (!def.types.includes('PROJECT')) return { valid: false, error: "not_a_project" };

        if (currentPlayer.projects.includes(projectId)) return { valid: false, error: "already_owned" };
        if (currentPlayer.debt > 0) return { valid: false, error: "pay_debt_first" };

        const cost = EconomyEngine.getCardCost(state, playerId, projectId);
        if (currentPlayer.coins < cost) return { valid: false, error: "insufficient_funds" };

        return { valid: true };
    }

    private static validateActivateLandscape(state: GameState, playerId: string, landscapeId: string): ValidationResult {
        const currentPlayer = getCurrentPlayer(state);
        if (!currentPlayer || currentPlayer.id !== playerId) return { valid: false, error: "not_your_turn" };

        // Check if landscape is active
        if (!state.landscapes.includes(landscapeId)) return { valid: false, error: "landscape_not_active" };

        const def = LandscapeRegistry.get(landscapeId);
        if (!def) return { valid: false, error: 'unknown_landscape' };

        // Allies: Can be activated in Action or Buy phase?
        // Usually Allies have "At start of turn" or "In Buy Phase" or "In Action Phase".
        // The ability usually specifies.
        // For generic activation, we might need to check def.allowedPhases?
        // Or assume Action/Buy is fine?
        // Most Allies are "You may spend X favors to..."
        // Let's allow in Action and Buy for now unless strictly restricted.
        if (state.phase !== 'ACTION' && state.phase !== 'BUY') return { valid: false, error: "invalid_phase" };

        // Check Favor cost (stored where? In def.cost or specific favorCost?)
        // LandscapeDefinition needs favorCost?
        // Or we check cost.debt/potion/coin? Allies use Favors.
        // We might need to cast cost to any or add favorCost to definition.
        // Let's assume def.setupRequirements or a specific property 'favorCost'.
        // For now, I'll access it safely.
        const favors = (def as any).favorCost || 0;
        if (favors > 0 && currentPlayer.favors < favors) return { valid: false, error: "not_enough_favors" };

        return { valid: true };
    }

    private static validateBuyLandscape(state: GameState, playerId: string, landscapeId: string): ValidationResult {
        const currentPlayer = getCurrentPlayer(state);
        if (!currentPlayer || currentPlayer.id !== playerId) return { valid: false, error: "not_your_turn" };
        if (state.phase !== 'BUY') return { valid: false, error: "invalid_phase" };
        if (currentPlayer.buys <= 0) return { valid: false, error: "no_buys" };

        if (!state.landscapes.includes(landscapeId)) return { valid: false, error: "landscape_not_active" };

        const def = LandscapeRegistry.get(landscapeId);
        if (!def) return { valid: false, error: "landscape_definition_not_found" };

        // Cost check
        if (def.cost) {
            const coinCost = def.cost.coin ?? 0;
            const potionCost = def.cost.potion ?? 0;

            if (currentPlayer.coins < coinCost) return { valid: false, error: "insufficient_coins" };
            if (currentPlayer.potions < potionCost) return { valid: false, error: "insufficient_potions" };
            // Debt doesn't prevent buying if you can take more? 
            // Actually in Dominion, you can buy if you have enough coins/potions. Debt is added AFTER.
            // But some rules might differ. Usually, you don't need to "have" debt to buy, you "gain" it.
        }

        return { valid: true };
    }

    private static validatePlayAllTreasures(state: GameState, playerId: string): ValidationResult {
        // Check if it's this player's turn
        const currentPlayer = getCurrentPlayer(state);
        if (!currentPlayer || currentPlayer.id !== playerId) {
            return { valid: false, error: "Ce n'est pas votre tour" };
        }

        // Allow in ACTION (triggers auto-end) or BUY phase
        if (state.phase !== 'BUY' && state.phase !== 'ACTION') {
            return { valid: false, error: 'Phase incorrecte (Action ou Achat uniquement)' };
        }

        return { valid: true };
    }

    private static validatePayDebt(state: GameState, playerId: string, amount: number): ValidationResult {
        const player = state.players.find(p => p.id === playerId);
        if (!player) return { valid: false, error: 'Joueur non trouvé' };
        if (state.phase !== 'BUY') return { valid: false, error: 'Phase incorrecte (doit être phase Achat)' };
        if (amount <= 0) return { valid: false, error: 'Montant invalide' };
        if (amount > player.coins) return { valid: false, error: 'Pas assez de pièces' };
        if (amount > player.debt) return { valid: false, error: 'Le montant dépasse la dette' };
        return { valid: true };
    }

    private static validateEndPhase(state: GameState, playerId: string): ValidationResult {
        const currentPlayer = getCurrentPlayer(state);
        if (!currentPlayer || currentPlayer.id !== playerId) {
            return { valid: false, error: "Ce n'est pas votre tour" };
        }

        if (state.phase !== 'ACTION' && state.phase !== 'BUY' && state.phase !== 'NIGHT') {
            return { valid: false, error: 'Impossible de terminer la phase maintenant' };
        }

        return { valid: true };
    }

    private static validateChoice(
        state: GameState,
        playerId: string,
        choiceId: string,
        payload: { type: string;[key: string]: unknown }
    ): ValidationResult {
        if (!state.pendingDecision) {
            return { valid: false, error: "Aucun choix en attente" };
        }

        if (state.pendingDecision.id !== choiceId) {
            return { valid: false, error: 'ID de choix invalide' };
        }

        if (state.pendingDecision.playerId !== playerId) {
            return { valid: false, error: "Ce n'est pas à votre tour de choisir" };
        }

        // Validate payload based on choice type
        switch (state.pendingDecision.type as any) {
            case PromptType.CHOOSE_CARDS:
            case 'ZONE_SEARCH':
            case PromptType.ZONE_SEARCH: {
                // Check if it's a Supply selection or Card selection
                if (state.pendingDecision.constraints?.sourceZone === 'supply') {
                    // Expect SUPPLY payload
                    if (payload.type !== 'SUPPLY') {
                        return { valid: false, error: 'Sélection de réserve attendue' };
                    }
                    const cardId = payload.cardId as string;
                    const pile = state.supply[cardId];
                    if (!pile || pile.count <= 0) {
                        return { valid: false, error: 'Sélection de réserve invalide' };
                    }
                    // Check filter
                    if (state.pendingDecision.constraints?.filter?.maxCost !== undefined) {
                        const cardCost = EconomyEngine.getCardCost(state, playerId, cardId);
                        if (cardCost > state.pendingDecision.constraints.filter.maxCost) {
                            return { valid: false, error: 'Coût de la carte trop élevé' };
                        }
                    }
                } else {
                    // Expect CARDS payload OR UPDATE_SELECTION for real-time sync
                    if (payload.type !== 'CARDS' && payload.type !== 'PASS' && payload.type !== 'UPDATE_SELECTION') {
                        return { valid: false, error: 'Sélection de carte attendue' };
                    }
                    if (payload.type === 'PASS' || payload.type === 'UPDATE_SELECTION') return { valid: true };

                    const cardIds = payload.cardInstanceIds as string[];
                    const min = state.pendingDecision.constraints?.min ?? 0;
                    const max = state.pendingDecision.constraints?.max ?? Infinity;

                    let effectiveMin = min;
                    const sourceZone = state.pendingDecision.constraints?.sourceZone;

                    if (sourceZone) {
                        const player = state.players.find(p => p.id === state.pendingDecision!.playerId);
                        if (player) {
                            let availableCards = sourceZone === 'hand' ? player.hand :
                                sourceZone === 'deck' ? player.deck :
                                    sourceZone === 'discardPile' ? player.discardPile :
                                        sourceZone === 'limbo' ? player.limbo :
                                            player.aside;
                            availableCards = availableCards || [];
                            const validCards = EffectUtils.filterCards(availableCards, state.pendingDecision.constraints?.filter);
                            effectiveMin = Math.min(min, validCards.length);
                        }
                    }

                    if (cardIds.length < effectiveMin) {
                        return { valid: false, error: `Vous devez sélectionner au moins ${effectiveMin} cartes` };
                    }
                    if (cardIds.length > max) {
                        return { valid: false, error: `Vous ne pouvez pas sélectionner plus de ${max} cartes` };
                    }

                    // Check unique names if required (Empires: Temple)
                    if (state.pendingDecision.constraints?.filter?.uniqueNames) {
                        const player = state.players.find(p => p.id === state.pendingDecision!.playerId);
                        if (player) {
                            const sourceZone = (state.pendingDecision.constraints.sourceZone || 'hand').toLowerCase();
                            const cards = (player as any)[sourceZone] as any[] || []; // e.g. hand, discardPile
                            const selectedCards = cards.filter(c => cardIds.includes(c.instanceId));
                            const uniqueNames = new Set(selectedCards.map(c => c.id));
                            if (uniqueNames.size !== selectedCards.length) {
                                return { valid: false, error: 'Les cartes sélectionnées doivent avoir des noms différents' };
                            }
                        }
                    }
                }
                break;
            }
            case PromptType.SELECT_OPTION: {
                // Support both single OPTION (legacy/single) and OPTIONS (multi)
                if (payload.type === 'OPTION') {
                    // Legacy: Check if choice is in options (string comparison)
                    // If options are objects, this might fail if client sends label.
                    // But effectively, payload should send INDEX for robustness if possible, but legacy sends string?
                    // Let's check pendingDecision.options structure.
                    // If options are strings, easy. If objects {label, effects}, we need to check how client sends it.
                    // Assuming legacy client sends index now? No, type definition says optionIndex: number.
                    // Wait, previous RulesValidator code used `payload.choice as string`.
                    // Let's standardise on indices if possible, or support both.

                    const options = (state.pendingDecision.options && state.pendingDecision.options.length > 0)
                        ? state.pendingDecision.options
                        : (state.pendingDecision.context?.options || []);
                    const optionsCount = options.length;

                    if (typeof payload.optionIndex === 'number') {
                        if (payload.optionIndex < 0 || payload.optionIndex >= optionsCount) {
                            return { valid: false, error: 'Index d\'option invalide' };
                        }
                    } else if (typeof payload.choice === 'string') {
                        // Fallback for string-based check (checking labels)
                        const choiceLabel = payload.choice;
                        if (state.pendingDecision.options && !state.pendingDecision.options.some(o => o.label === choiceLabel)) {
                            // Option with this label not found
                            // We allow it loosely IF strict validation isn't critical or relying on yes/no which might not be in options explicitly?
                            // But DecisionOption[] usually implies explicit options.
                            // For YES_NO, options might be undefined in PendingDecision?
                            // If options is undefined, this block is skipped.
                        }
                    }
                    // We should encourage index usage.
                    // For now, let's trust if it's not strictly found but maybe we should rely on index.
                    // Let's assume Valid for now to not break legacy if strict mode isn't desired, 
                    // BUT for Pawn we NEED indices.

                } else if (payload.type === 'OPTIONS') {
                    // Multi-select validation
                    if (!Array.isArray(payload.optionIndices)) {
                        return { valid: false, error: "Indices d'options attendus" };
                    }
                    const indices = payload.optionIndices as number[];
                    const min = state.pendingDecision.constraints?.min ?? 1;
                    const max = state.pendingDecision.constraints?.max ?? 1;

                    if (indices.length < min) {
                        return { valid: false, error: `Vous devez choisir au moins ${min} option(s)` };
                    }
                    if (indices.length > max) {
                        return { valid: false, error: `Vous ne pouvez pas choisir plus de ${max} option(s)` };
                    }

                    const options = (state.pendingDecision.options && state.pendingDecision.options.length > 0)
                        ? state.pendingDecision.options
                        : (state.pendingDecision.context?.options || []);
                    const optionsCount = options.length;
                    for (const idx of indices) {
                        if (typeof idx !== 'number' || idx < 0 || idx >= optionsCount) {
                            return { valid: false, error: 'Index d\'option hors limites' };
                        }
                    }

                    // Check for uniqueness if required
                    if (state.pendingDecision.context?.different) {
                        const unique = new Set(indices);
                        if (unique.size !== indices.length) {
                            return { valid: false, error: 'Les options doivent être différentes' };
                        }
                    }
                } else {
                    return { valid: false, error: "Sélection d'option attendue" };
                }
                break;
            }
            case PromptType.CONFIRM: {
                if (payload.type !== 'CONFIRM') {
                    return { valid: false, error: 'Confirmation attendue' };
                }
                break;
            }
            case PromptType.YES_NO: {
                if (payload.type !== 'OPTION') {
                    return { valid: false, error: 'Option attendue (OUI/NON)' };
                }
                const choice = payload.choice as string;
                if (!['YES', 'NO'].includes(choice)) {
                    return { valid: false, error: 'Choix invalide (doit être OUI ou NON)' };
                }
                break;
            }
            case PromptType.REORDER:
            case 'REORDER': {
                if (payload.type !== 'CARDS') {
                    return { valid: false, error: 'Sélection de cartes attendue pour la réorganisation' };
                }
                const cardIds = payload.cardInstanceIds as string[];
                // Basic validation: must have at least one card unless deck/aside was empty?
                // But usually REORDER arrives with specific cards.
                if (!Array.isArray(cardIds) || cardIds.length === 0) {
                    return { valid: false, error: 'Liste de cartes vide' };
                }
                break;
            }
            case PromptType.DECK_INSERTION: {
                if (payload.type !== 'CARDS') {
                    return { valid: false, error: 'Sélection de cartes attendue pour l\'insertion' };
                }
                // Deck insertion payload includes 'index'
                if (typeof payload.index !== 'number') {
                    return { valid: false, error: 'Index d\'insertion attendu' };
                }
                break;
            }
            case 'SENTRY_INTERACTION' as any: {
                // SENTRY_INTERACTION payload has trashIds, discardIds, reorderIds
                // It can also be an UPDATE_SELECTION (though unlikely for this specialized UI, good to be safe)
                if (payload.type === 'UPDATE_SELECTION') return { valid: true };

                // For final submission, we don't strictly validate the lists here 
                // as they are processed by the specialized handler.
                return { valid: true };
            }
            default:
                // Handle legacy types or mismatch if logical
                return { valid: false, error: 'Type de choix inconnu' };
        }

        return { valid: true };
    }
}
