import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState } from '../hooks/useSocket';
import { SupplyGrid } from './SupplyGrid';
import { LogView } from './LogView';
import { AnimatePresence } from 'framer-motion';
import { AnimatedCard } from './AnimatedCard';
import { CardFrame } from './CardFrame';
import { CardRegistry } from '../../shared/cards';
import { PromptType } from '../../shared/engine/prompts/Prompt';
import { HISTORICAL_PERSONAS } from '../../shared/data/historicalPersonas';
import { ActionBar } from './ActionBar';
import { PersonaTooltip } from './PersonaTooltip';
import { SelectionTray } from './SelectionTray';
import { UniversalOverlay } from './UniversalOverlay';
import { DraggableWindow } from './DraggableWindow';
import { useSound } from '../hooks/useSound';
import { ParticleOverlay } from './ParticleOverlay';
import { PlayerDurationZone } from './PlayerDurationZone';
import { SetAsideZone } from './SetAsideZone';
import { SideSupplyBar } from './SideSupplyBar';
import { vfxManager } from '../managers/VFXManager';
import { usePromptInteraction } from '../hooks/usePromptInteraction';
import { ZoneContainer } from './ZoneContainer';
import { TokenDisplay } from './TokenDisplay';
import { SmartCardOverlay, mapDecisionToOverlayProps } from './SmartCardOverlay';
import { KingdomOverviewModal } from './KingdomOverviewModal';
import { TavernMat } from './TavernMat';
import { ExileMat } from './ExileMat';
import { SpectatorBar } from './SpectatorBar';
import { DeckStatsPanel } from './DeckStatsPanel';
import { RoomState } from '../hooks/useSocket';
import { ChoiceModalV2 as ChoiceModal } from './ChoiceModalV2';
import './BoardLayout.css';

interface BoardLayoutProps {
    gameState: GameState;
    playerId: string | null;
    isHost?: boolean;
    onPlayCard: (instanceId: string) => void;
    onBuyCard: (cardId: string) => void;
    onEndPhase: () => void;
    onChoose: (choiceId: string, payload: any) => void;
    onToggleReady: () => void;
    onLeaveGame: () => void;
    onForceEndGame: () => void;
    onAcknowledgeReveal: () => void;
    onPlayAllTreasures?: () => void;
    onPayDebt?: (amount: number) => void;
    onRequestRewind?: (logId: string) => void;
    roomState?: RoomState;
    onConfigureSpectator?: (options: { followId?: string, revealAll?: boolean }) => void;
}

interface SelectedCard {
    id: string; // instanceId for hand, or unique string for supply
    cardId: string;
    source: 'HAND' | 'SUPPLY';
}

import { GameAnimationsProvider, useGameAnimations } from '../context/GameAnimationsContext';

// ... (Existing interfaces)

import { GameOverScreen } from './GameOverScreen';

// Wrapper Component with Provider
export const BoardLayout: React.FC<BoardLayoutProps> = (props) => {
    // Check if Game Over
    if (props.gameState.public.phase === 'GAME_OVER') {
        return <GameOverScreen gameState={props.gameState} onReturnToMenu={props.onLeaveGame} />;
    }

    console.log('[DEBUG] BoardLayout Wrapper Rendering. onLeaveGame attached:', !!props.onLeaveGame);
    console.log('[DEBUG] Supply Count:', Object.keys(props.gameState.public.supply).length, Object.keys(props.gameState.public.supply));
    return (
        <GameAnimationsProvider>
            <BoardLayoutContent {...props} />
        </GameAnimationsProvider>
    );
};

// Internal Component with Logic
const BoardLayoutContent: React.FC<BoardLayoutProps> = ({
    gameState,
    playerId,
    onPlayCard,
    onBuyCard,
    onEndPhase,
    onChoose: onSendDecision,
    onToggleReady,
    onLeaveGame,
    onForceEndGame,
    onAcknowledgeReveal,
    isHost,
    onPlayAllTreasures,
    onPayDebt,
    onRequestRewind,
    roomState,
    onConfigureSpectator
}) => {
    console.log('[DEBUG] BoardLayoutContent Rendering. onLeaveGame type:', typeof onLeaveGame);
    const { registerTarget, playGainAnimation, playShuffleAnimation, hiddenIds } = useGameAnimations();
    const { playSound, isMuted, toggleMute } = useSound();
    const [showQuitConfirm, setShowQuitConfirm] = useState(false);

    // Rewind Selection State
    const [rewindMode, setRewindMode] = useState(false);
    const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
    const [showKingdomModal, setShowKingdomModal] = useState(false);
    const [isDeckStatsVisible, setIsDeckStatsVisible] = useState(false);

    // Unified Overlay State
    type ActiveOverlay = { type: 'TRASH' } | { type: 'DURATION'; playerId: string } | { type: 'SET_ASIDE' };
    const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay | null>(null);

    // --- SELECTION REFACTOR (PHASE 4) ---
    // We now use server-side persistence via PlayerState.currentSelection
    // But we still need to resolve those IDs into full SelectedCard objects for the UI
    const myPlayer = gameState.public.players.find(p => p.id === playerId);
    const currentSelectionIds = myPlayer?.currentSelection || [];

    const onUpdateSelection = useCallback((newIds: string[]) => {
        onSendDecision(gameState.public.pendingDecision?.id || 'none', {
            type: 'UPDATE_SELECTION',
            selectedIds: newIds
        });
    }, [onSendDecision, gameState.public.pendingDecision?.id]);

    const {
        toggleCard,
        isValid
    } = usePromptInteraction(
        gameState.public.pendingDecision as any, // Cast to avoid Type vs Interface mismatch
        currentSelectionIds,
        onUpdateSelection
    );

    // Derived UI State: Resolving IDs to Objects for the Tray
    const selectedCards: SelectedCard[] = currentSelectionIds.map(id => {
        // 1. Try to find in Hand
        const handCard = gameState.private?.hand.find((c: any) => c.instanceId === id);
        if (handCard) return { id, cardId: handCard.id, source: 'HAND' as const };

        // 2. Try to find in Supply (Pseudo-ID check)
        // Supply IDs format: "supply-[cardId]-[timestamp]-[random]"
        if (id.startsWith('supply-')) {
            const parts = id.split('-');
            // parts[0] = supply, parts[1] = cardId
            if (parts.length >= 2) return { id, cardId: parts[1], source: 'SUPPLY' as const };
        }

        // 3. Fallback / Other zones
        return { id, cardId: 'unknown', source: 'HAND' as const };
    }).filter(c => c.cardId !== 'unknown');

    const [selectedOptionIndices, setSelectedOptionIndices] = useState<number[]>([]);
    // Removed old separate states
    // const [showDurationOverlayFor, setShowDurationOverlayFor] = useState<string | null>(null);
    // const [showSetAsideOverlay, setShowSetAsideOverlay] = useState<boolean>(false);

    useEffect(() => {
        // Reset option selection when decision changes
        setSelectedOptionIndices([]);
    }, [gameState?.public?.pendingDecision?.id]);

    const pendingPlayIdsRef = useRef<Set<string>>(new Set());
    const prevHandRef = useRef<any[]>([]); // Track previous hand to detect draws
    const prevDiscardCountRef = useRef(0);
    const prevDeckCountRef = useRef(0);
    const prevPhaseRef = useRef<string>('');
    const prevCoinsRef = useRef(0);
    const prevActionsRef = useRef(0);
    const prevBuysRef = useRef(0);
    const deckRef = useRef<HTMLDivElement | null>(null); // Local ref for Deck to get Rect
    const discardRef = useRef<HTMLDivElement | null>(null); // Local ref for Discard
    const hasMountedRef = useRef(false); // Skip animation on initial mount
    const processingDecisionIdRef = useRef<string | null>(null); // Prevent double-submissions for same decision

    // Audio Triggers & Game Events
    const lastLogIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!gameState) return;

        // 1. Turn Start Sound
        const isMyTurn = playerId === gameState.public.players[gameState.public.currentPlayerIndex]?.id;
        if (isMyTurn && prevPhaseRef.current !== gameState.public.phase && gameState.public.phase === 'ACTION') {
            playSound('turn_start', 0.2);
        }
        prevPhaseRef.current = gameState.public.phase;

        // 2. Resource Gain Sounds & Particles
        const myPlayer = gameState.public.players.find(p => p.id === playerId);
        const currentCoins = myPlayer?.coins ?? 0;
        const currentActions = myPlayer?.actions ?? 0;
        const currentBuys = myPlayer?.buys ?? 0;

        if (myPlayer) {
            // Coins
            if (currentCoins > prevCoinsRef.current) {
                const diff = currentCoins - prevCoinsRef.current;
                playSound('coins', 0.15);
                vfxManager.triggerParticle(window.innerWidth / 2 + 100, window.innerHeight - 200, 'gold', diff);
            }

            // Actions
            if (currentActions > prevActionsRef.current) {
                const diff = currentActions - prevActionsRef.current;
                // vfxManager type for 'action' not defined? Using generic or VP for now?
                // Let's stick to simple text if type not exact match, or map to 'vp' (green)/custom color
                vfxManager.triggerParticle(200, window.innerHeight - 200, 'card', diff, '#fff'); // White for actions
            }

            // Buys
            if (currentBuys > prevBuysRef.current) {
                const diff = currentBuys - prevBuysRef.current;
                if (gameState.public.phase !== 'START') {
                    vfxManager.triggerParticle(300, window.innerHeight - 200, 'card', diff, '#ff9f43'); // Orange for buys
                }
            }
        }

        prevCoinsRef.current = currentCoins;
        prevActionsRef.current = currentActions;
        prevBuysRef.current = currentBuys;

        // 3. Log-based Sound Triggers
        if (gameState.public.logs.length > 0) {
            const lastLog = gameState.public.logs[gameState.public.logs.length - 1];
            if (lastLog.id !== lastLogIdRef.current) {
                lastLogIdRef.current = lastLog.id;

                // Simple keyword matching for "Game Juice"
                const msg = lastLog.message.toLowerCase();

                if (msg.includes('écarte') || msg.includes('trash')) {
                    playSound('trash', 0.4);
                }

                if (msg.includes('attack') || msg.includes('attaque')) {
                    playSound('warning', 0.4);
                    vfxManager.triggerParticle(window.innerWidth / 2, window.innerHeight / 2, 'attack');
                }

                if (msg.includes('gagn') && msg.includes('malédiction')) {
                    playSound('warning', 0.3);
                    vfxManager.triggerParticle(window.innerWidth / 2, window.innerHeight / 2, 'curse');
                }
            }
        }

    }, [gameState.public.phase, gameState.public.currentPlayerIndex, gameState.public.players, gameState.public.logs, playerId, playSound]);

    // DRAW ANIMATION LOGIC
    useEffect(() => {
        if (!gameState.private?.hand) return;
        const currentHand = gameState.private.hand;
        const prevHand = prevHandRef.current;
        const currentDiscardCount = gameState.public.players.find(p => p.id === playerId)?.discardCount ?? 0;
        const currentDeckCount = gameState.public.players.find(p => p.id === playerId)?.deckCount ?? 0;

        // Skip animation on initial mount (page load/refresh)
        // This prevents all initial hand cards from being hidden during animation
        if (!hasMountedRef.current) {
            hasMountedRef.current = true;
            prevHandRef.current = currentHand;
            prevDiscardCountRef.current = currentDiscardCount;
            prevDeckCountRef.current = currentDeckCount;
            return;
        }

        // --- SHUFFLE DETECTION ---
        let shuffleDelay = 0;
        // If discard went to 0 (from >0) AND deck increased -> Implicit Shuffle
        if (prevDiscardCountRef.current > 0 && currentDiscardCount === 0 && currentDeckCount > prevDeckCountRef.current) {
            if (discardRef.current && deckRef.current) {
                const startRect = discardRef.current.getBoundingClientRect();
                const targetRect = deckRef.current.getBoundingClientRect();
                playShuffleAnimation(startRect, targetRect);
                playSound('shuffle');
                shuffleDelay = 2000; // Wait for shuffle to finish before drawing
            }
        }

        // Smart Diff: Distinguish between truly NEW cards (drawn) and EXISTING cards with changed IDs.
        // If IDs change on the server (e.g. after playing a card), naive diff thinks all remaining cards are new.

        // 1. Identify potential new cards (by instanceId)
        const prevIds = new Set(prevHand.map(c => c.instanceId));
        let newCards = currentHand.filter(c => !prevIds.has(c.instanceId));

        // 2. Identify potential missing cards (by instanceId)
        const currentIds = new Set(currentHand.map(c => c.instanceId));
        const missingCards = prevHand.filter(c => !currentIds.has(c.instanceId));

        // 3. Filter out "renamed" cards: match newCards with missingCards by cardId (type)
        if (newCards.length > 0 && missingCards.length > 0) {
            const missingPool = [...missingCards];
            newCards = newCards.filter(newCard => {
                // Try to find a matching card in missingPool (same type)
                const matchIndex = missingPool.findIndex(m => m.id === newCard.id);
                if (matchIndex !== -1) {
                    // Found a match! It's likely the same card with a new ID (or substituted).
                    // Remove from pool and DO NOT animate.
                    missingPool.splice(matchIndex, 1);
                    return false;
                }
                // No match found -> It's a genuinely new card (drawn/gained).
                return true;
            });
        }

        if (newCards.length > 0 && deckRef.current) {
            const deckRect = deckRef.current.getBoundingClientRect();
            // Animate only truly new cards
            newCards.forEach((c, i) => {
                // Stagger animations slightly + add shuffle delay
                setTimeout(() => {
                    const isDraw = currentHand.length > prevHand.length;
                    playGainAnimation(c.id, c.instanceId, deckRect, 'hand');
                    if (isDraw) playSound('card_play', 0.3); // Reuse card_play for draw
                }, shuffleDelay + (i * 100));
            });
        }

        prevHandRef.current = currentHand;
        prevDiscardCountRef.current = currentDiscardCount;
        prevDeckCountRef.current = currentDeckCount;
    }, [gameState.private?.hand, gameState.public.players, playerId, playGainAnimation, playShuffleAnimation]);

    // Clean up pending plays when hand updates (server confirmed the play)
    useEffect(() => {
        if (!gameState.private?.hand) return;
        const currentHandIds = new Set(gameState.private.hand.map(c => c.instanceId));

        // Prune pending set
        const currentPending = pendingPlayIdsRef.current;
        for (const id of currentPending) {
            if (!currentHandIds.has(id)) {
                currentPending.delete(id);
            }
        }
    }, [gameState.private?.hand]);

    useEffect(() => {
        const handleResize = () => {
            // Target Baseline: 1440x900 (Professional standard)
            const targetWidth = 1440;
            const targetHeight = 900;

            const scaleX = window.innerWidth / targetWidth;
            const scaleY = window.innerHeight / targetHeight;

            // Global Scale: Smallest of both dimensions, capped at 1.0 (no zoom in)
            const newScale = Math.min(scaleX, scaleY, 1);

            document.documentElement.style.setProperty('--layout-scale', newScale.toString());
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const { public: pub, private: priv } = gameState;
    const pendingDecision = pub.pendingDecision;
    const isMyChoice = pendingDecision && pendingDecision.playerId === playerId;
    const isSelectionMode = isMyChoice && (pendingDecision?.type === PromptType.CHOOSE_CARDS || pendingDecision?.type === PromptType.ZONE_SEARCH);
    const isZoneSearch = isMyChoice && (
        (pendingDecision?.type === PromptType.ZONE_SEARCH || pendingDecision?.type === PromptType.CHOOSE_CARDS) &&
        pendingDecision?.constraints?.sourceZone &&
        pendingDecision.constraints.sourceZone !== 'HAND' &&
        !String(pendingDecision.constraints.sourceZone).toUpperCase().includes('SUPPLY') && // Case-insensitive check

        // HACK: If there is a maxCost constraint or message implies cost limit, it's likely a Supply Gain -> Grid View, not Inspector
        !(pendingDecision.constraints?.maxCost !== undefined ||
            pendingDecision.context?.maxCost !== undefined ||
            pendingDecision.message.match(/(?:coût max|max cost|jusqu'à|up to)[:\s]+(\d+)/i))
    );
    const isReorderMode = isMyChoice && (
        pendingDecision?.context?.specialAction === 'TOPDECK_FROM_HAND' ||
        pendingDecision?.context?.specialAction === 'TOPDECK_FROM_DISCARD' ||
        pendingDecision?.message.toLowerCase().includes('ordre')
    );

    // Rewind handlers
    const handleRewindToggle = () => {
        setRewindMode(!rewindMode);
        setSelectedLogId(null); // Reset selection
    };

    const handleLogSelect = (logId: string) => {
        setSelectedLogId(logId);
    };

    const handleRewindConfirm = () => {
        if (selectedLogId && onRequestRewind) {
            onRequestRewind(selectedLogId);
            setRewindMode(false);
            setSelectedLogId(null);
        }
    };

    // DEBUG: Log pending decision state
    useEffect(() => {
        if (pendingDecision) {
            console.log('[BoardLayout] Pending Decision Update:', {
                id: pendingDecision.id,
                type: pendingDecision.type,
                playerId: pendingDecision.playerId,
                myId: playerId,
                isMyChoice,
                hasOptions: !!(pendingDecision.options || pendingDecision.context?.options)
            });
        }
    }, [pendingDecision, playerId, isMyChoice]);

    // Clear selection when decision ID changes
    useEffect(() => {
        // setSelectedCards([]); // This is now handled by the hook/server state
        processingDecisionIdRef.current = null; // Reset processing guard
    }, [pendingDecision?.id]);

    // const myPlayer = pub.players.find(p => p.id === playerId); // Already defined above
    const currentPlayer = pub.players[pub.currentPlayerIndex];
    const isMyTurn = playerId === currentPlayer?.id;

    // HAND SELECTION
    const toggleHandSelection = (instanceId: string, _cardId: string) => {
        if (!isSelectionMode) return;
        toggleCard(instanceId);
    };

    // SUPPLY SELECTION
    const handleSupplySelection = (cardId: string) => {
        if (!isSelectable(cardId)) return;

        // Auto-confirm logic for single supply choice (Buy/Gain)
        // We bypass persistence here for speed if max=1
        const max = pendingDecision?.constraints?.max;
        if (max === 1 && pendingDecision) {
            if (processingDecisionIdRef.current === pendingDecision.id) return;
            processingDecisionIdRef.current = pendingDecision.id;
            onSendDecision(pendingDecision.id, {
                type: 'SUPPLY',
                cardId: cardId
            });
            return;
        }

        // Otherwise generate a unique ID and toggle it
        // Note: For supply, "toggle" means "add another" usually, unless we clicked selected?
        // Current toggleCard logic handles ID toggling.
        // For supply, we need a NEW ID every click if we want multiple copies.
        // But toggleCard removes if exists.
        // If we want multiple copies of Copper, we need unique IDs.
        const pseudoId = `supply-${cardId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        toggleCard(pseudoId);
    };

    const handleRemoveSelection = (id: string) => {
        // Toggle off explicitly
        // Logic in hook handles removal if it exists
        toggleCard(id);
    };

    const handleCancelSelection = () => {
        onUpdateSelection([]); // Clear all
    };

    // Helper to check if a supply card is selectable (moved from SupplyGrid logic)
    const isSelectable = (cardId: string): boolean => {
        if (!pendingDecision) return false;
        const pile = pub.supply[cardId];
        if (!pile || pile.count <= 0) return false;

        // Count selected instances of this pile to prevent selecting more than available
        const selectedCount = selectedCards.filter(c => c.cardId === cardId && c.source === 'SUPPLY').length;
        if (selectedCount >= pile.count) return false;

        const constraints = pendingDecision.constraints;
        // If sourceZone is strictly defined:
        if (constraints?.sourceZone && constraints.sourceZone !== 'supply') return false;

        // If explicit card choices (unlikely for supply, but possible)
        // Usually Supply choice is implied by context or explicitly CHOOSE_SUPPLY?
        // Let's assume generic filter logic:
        const filter = constraints?.filter || pendingDecision.context?.filter;

        if (filter?.maxCost !== undefined) {
            const cost = CardRegistry.get(cardId)?.cost ?? 0;
            if (cost > filter.maxCost) return false;
        }

        // Filter by Card IDs if present
        if (filter?.cardIds && !filter.cardIds.includes(cardId)) return false;

        return true;
    };


    const handleConfirm = (overrideIds?: string[]) => {
        if (!pendingDecision) return;

        // Ensure overrideIds is actually an array (and not a MouseEvent from onClick)
        if (overrideIds && Array.isArray(overrideIds)) {
            onSendDecision(pendingDecision.id, {
                type: 'CARDS',
                cardInstanceIds: overrideIds
            });
            return;
        }

        // Payload construction depends on what was selected
        // Mix of Hand and Supply is rare but theoretically possible (e.g. "Trash a card to Gain a card" - usually 2 prompts though)
        // Assuming homogeneous selection for now as per current Prompts.

        const handSelections = selectedCards.filter(c => c.source === 'HAND');
        const supplySelections = selectedCards.filter(c => c.source === 'SUPPLY');

        if (handSelections.length > 0) {
            onSendDecision(pendingDecision.id, {
                type: 'CARDS',
                cardInstanceIds: handSelections.map(c => c.id)
            });
        } else if (supplySelections.length > 0) {
            // If selecting from supply
            // If single selection (standard):
            if (supplySelections.length === 1) {
                onSendDecision(pendingDecision.id, {
                    type: 'SUPPLY',
                    cardId: supplySelections[0].cardId
                });
            } else {
                // If multiple supply selections supported by engine?
                // Fallback to sending just the first if engine doesn't support list
                // TODO: Verify if engine supports `cardIds` for SUPPLY type. 
                // For now, assuming single choice is the main use case for supply (Buy/Gain)
                onSendDecision(pendingDecision.id, {
                    type: 'SUPPLY',
                    cardId: supplySelections[0].cardId
                });
            }
        } else {
            // No selection confirmed (maybe 0 allowed?)
            onSendDecision(pendingDecision.id, { type: 'CARDS', cardInstanceIds: [] });
        }
    };

    // ... (rest of code) ...

    const handleChooseOption = useCallback((optionIndex: number) => {
        if (!pendingDecision) return;

        const max = pendingDecision.constraints?.max ?? 1;

        // If simple single choice (min=1, max=1), act immediately like before for better UX
        if (max === 1) {
            onSendDecision(pendingDecision.id, {
                type: 'OPTION',
                optionIndex
            });
            return;
        }

        // Multi-select logic
        setSelectedOptionIndices(prev => {
            if (prev.includes(optionIndex)) {
                return prev.filter(i => i !== optionIndex); // Toggle off
            }
            if (prev.length >= max) {
                return prev; // Max reached
            }
            return [...prev, optionIndex].sort(); // Toggle on
        });
    }, [onSendDecision, pendingDecision]);

    const handleSubmitOptions = useCallback(() => {
        if (!pendingDecision) return;
        // Construct payload: server expects 'optionIndices' for multi-select, or multiple 'OPTION' calls?
        // Checking EffectEngine: it iterates 'count' times.
        // Actually, for CHOOSE_OPTION with count > 1, the server likely expects 'optionIndices' array OR handle sequentially?
        // Let's check how the Prompt response is structured. 
        // Standard convention: { type: 'OPTIONS', optionIndices: [...] }

        onSendDecision(pendingDecision.id, {
            type: 'OPTIONS', // New type for multi-select
            optionIndices: selectedOptionIndices
        });
    }, [onSendDecision, pendingDecision, selectedOptionIndices]);

    const handlePass = () => {
        if (!pendingDecision) return;
        onSendDecision(pendingDecision.id, { type: 'PASS' });
    };



    // Calculate Waiting State (My turn, but decision is for someone else)
    const isWaiting = isMyTurn && pendingDecision && !isMyChoice;

    const getInstructionText = () => {
        if (!gameState) return '';
        const { public: pub, private: priv } = gameState;
        const pendingDecision = pub.pendingDecision;

        // 1. Decision Pending (Highest Priority)
        if (pendingDecision) {
            if (pendingDecision.type === PromptType.REORDER || pendingDecision.type === 'REORDER') {
                return ""; // Hide label in ActionBar as it's redundant with Overlay title
            }
            if (isMyChoice) {
                return pendingDecision.message;
            } else {
                const decPlayer = pub.players.find(p => p.id === pendingDecision.playerId);
                return `En attente de ${decPlayer?.name || "l'adversaire"}...`;
            }
        }

        // 2. No Decision, but my turn (Phase Instructions)
        if (isMyTurn) {
            if (pub.phase === 'ACTION') {
                const hasActions = priv?.hand.some((c: any) => CardRegistry.get(c.id)?.types.includes('ACTION'));
                return hasActions ? 'Jouez des cartes Action' : "Aucune action possible. Passez à l'achat.";
            }
            if (pub.phase === 'BUY') {
                return `Phase d'Achat : ${myPlayer?.coins ?? 0}💰, ${myPlayer?.buys ?? 0} achats`;
            }
            if (pub.phase === 'CLEANUP') return 'Phase de Nettoyage...';
        }
    }
    // 3. Instruction Text (Decision message or Phase instruction or Current Turn)
    const instructionText = getInstructionText() || `Tour de ${currentPlayer?.name}` || '';

    // Calculate cards for the inspector (Deck search, Discard search, etc.)
    let inspectorCards: any[] = [];
    if (isZoneSearch && pendingDecision) {
        // STATE SERIALIZER V2: Specifically for ZONE_SEARCH, the server injects 'cards' directly into pendingDecision
        const rootCards = (pendingDecision as any).cards;
        inspectorCards = rootCards ?? pendingDecision.context?.cards ?? [];

        // Fallback: If cards are in Limbo and it's a Limbo interaction
        if (inspectorCards.length === 0 && (pendingDecision.constraints?.sourceZone === 'limbo' || pendingDecision.constraints?.sourceZone === 'LIMBO')) {
            inspectorCards = (myPlayer as any)?.limbo || [];
        }

        console.log('[BoardLayout] Inspector Cards:', inspectorCards?.length);
    }

    const isInteractionLocked = isZoneSearch;
    // Hand Lock: Strictly locked if finding cards in Supply (e.g. Workshop)
    const isHandLocked = pendingDecision?.constraints?.sourceZone === 'supply';

    const roomPlayer = roomState?.players.find(p => p.id === playerId);
    const isSpectator = roomPlayer?.isSpectator || false;

    return (
        <div className="board-layout">
            {isSpectator && roomState && onConfigureSpectator && (
                <SpectatorBar
                    gameState={gameState}
                    roomState={roomState}
                    currentFollowId={roomPlayer?.spectatorFollowId}
                    isRevealAll={roomPlayer?.spectatorRevealAll || false}
                    onConfigure={onConfigureSpectator}
                />
            )}

            {/* Zone 1, 6, 7, 8: LEFT COLUMN */}
            <div className="layout-col-left">
                <div className="zone-1-opponents">
                    {pub.players.filter(p => p.id !== playerId).map(p => {
                        const persona = HISTORICAL_PERSONAS.find((h: any) => p.name.includes(h.name)) || {
                            name: p.name,
                            description: "Un adversaire mystérieux...",
                            era: "Inconnu",
                            years: "???"
                        };
                        return (
                            <div key={p.id} className="opponent-score-item">
                                <PersonaTooltip persona={persona}>
                                    <span style={{ color: p.color, cursor: 'help' }}>
                                        {p.name}
                                    </span>
                                </PersonaTooltip>
                                <span className="opponent-vp-score">{p.score} VP</span>
                            </div>
                        );
                    })}
                </div>
                <div className={`zone-6-7-supply ${isInteractionLocked ? 'zone-locked' : ''}`}>
                    <SupplyGrid
                        supply={pub.supply}
                        variant="treasures-victories"
                        onBuy={onBuyCard}
                        canBuy={isMyTurn && pub.phase === 'BUY' && (myPlayer?.buys ?? 0) > 0}
                        coins={myPlayer?.coins ?? 0}
                        costReduction={myPlayer?.costReduction ?? 0}
                        pendingDecision={pendingDecision}
                        onChoose={onSendDecision}
                        landscapeState={pub.landscapeState}
                    />
                </div>
                <div className="zone-8-profile-area">
                    <div className="opponent-score-item my-profile-item">
                        <div className="profile-main-info" onClick={() => setIsDeckStatsVisible(!isDeckStatsVisible)} style={{ cursor: 'pointer' }}>
                            <span style={{ color: myPlayer?.color }}>{myPlayer?.name}</span>
                            <span className="opponent-vp-score">{myPlayer?.score} VP</span>
                            <span className="stats-toggle-icon">{isDeckStatsVisible ? '📊' : '📈'}</span>
                        </div>
                    </div>

                    <DeckStatsPanel
                        stats={(myPlayer as any)?.deckStats}
                        isVisible={isDeckStatsVisible}
                    />

                    <div className="profile-piles">
                        {/* Deck (Zone 9) */}
                        <div className="profile-pile-item" title="Ma Pioche" ref={(el) => { deckRef.current = el; registerTarget('deck', el); }}>
                            <CardFrame cardId="Pioche" variant="full" count={myPlayer?.deckCount} showCount={true} />
                        </div>
                        <div className="profile-pile-item" title="Ma Défausse" ref={(el) => { discardRef.current = el; registerTarget('discard', el); }}>
                            {myPlayer?.topDiscard ? (
                                <CardFrame cardId={myPlayer.topDiscard.id} variant="full" showCost={false} count={myPlayer?.discardCount} showCount={true} />
                            ) : (
                                <CardFrame cardId="Défausse" variant="full" count={0} showCount={true} />
                            )}
                        </div>
                    </div>
                </div>

                {/* DurationView REMOVED - Moved to Center Column (Player) and Headers (Opponents) */}
            </div>

            {/* Hub: CENTER COLUMN */}
            <div className="layout-col-center">
                <div className="center-header">
                    <div className="opponents-hands-header">
                        {pub.players.filter(p => p.id !== playerId).map(p => (
                            <div key={p.id} className="opponent-game-state" style={{ backgroundColor: `${p.color} 20` }}>
                                {/* Deck & Discard to the left */}
                                <div className="opponent-piles">
                                    <div className="opponent-mini-pile deck" title={`${p.name}: ${p.deckCount} cartes en pioche`}>
                                        {p.deckCount > 0 ? (
                                            <>
                                                <div className="card-back-mini" />
                                                <div className="mini-pile-count">{p.deckCount}</div>
                                            </>
                                        ) : (
                                            <div className="mini-pile-placeholder"></div>
                                        )}
                                    </div>
                                    <div className="opponent-mini-pile discard" title={`${p.name}: ${p.discardCount} cartes en défausse`}>
                                        {p.topDiscard ? (
                                            <div className="opponent-discard-preview">
                                                <CardFrame cardId={p.topDiscard.id} variant="mini" showCost={false} />
                                                <div className="mini-pile-count">{p.discardCount}</div>
                                            </div>
                                        ) : (
                                            <div className="mini-pile-placeholder"></div>
                                        )}
                                    </div>
                                    {/* OPPONENT DURATION INDICATOR */}
                                    {(() => {
                                        const oppDurations = p.playArea?.filter((c: any) => {
                                            const def = CardRegistry.get(c.id);
                                            const isDuration = def?.types.includes('DURATION');
                                            // Show in Duration Badge if it's Duration AND (Legacy persistent OR (New persistence AND played in previous global turn))
                                            // If turnPlayed is missing, assume it's old (fallback) or check resolved status
                                            const isOld = c.turnPlayed !== undefined ? c.turnPlayed < pub.turnNumber : true;
                                            return isDuration && (!c.isResolved || (c.durationTurns !== undefined && c.durationTurns > 0)) && isOld;
                                        }) || [];

                                        if (oppDurations.length === 0) return null;

                                        return (
                                            <div
                                                className="opponent-duration-badge"
                                                onClick={() => setActiveOverlay({ type: 'DURATION', playerId: p.id })}
                                                title={`${oppDurations.length} effets durables actifs`}
                                                style={{ borderColor: p.color, color: p.color }}
                                            >
                                                <span className="vert-text">DURÉE</span>
                                                <span className="badge-count">{oppDurations.length}</span>
                                            </div>
                                        );
                                    })()}
                                </div>
                                {/* Visual Hand Fan OR Revealed Hand for Spectators */}
                                <div className="opponent-hand-visual" style={{ minHeight: '120px' }}>
                                    {(() => {
                                        // If Reveal All is active, we have access to the actual cards via spectatorData
                                        const spectatorHandInfo = gameState.spectatorData?.find(sd => sd.playerId === p.id);
                                        const handCards = spectatorHandInfo ? spectatorHandInfo.hand : [...Array(Math.min(p.handCount, 15))].map(() => ({ id: 'back' }));

                                        return handCards.map((c: any, i: number, arr: any[]) => {
                                            const total = arr.length;
                                            const angleStep = Math.min(10, 60 / Math.max(1, total)); // compress angle for large hands
                                            const startAngle = -((total - 1) * angleStep) / 2;
                                            const rotate = startAngle + (i * angleStep);

                                            const center = (total - 1) / 2;
                                            const dist = Math.abs(i - center);
                                            const translateY = dist * dist * 1.5;

                                            return (
                                                <div
                                                    key={c.instanceId || i}
                                                    className="opponent-hand-card"
                                                    style={{
                                                        transform: `rotate(${rotate}deg) translateY(${translateY}px)`,
                                                        zIndex: i,
                                                    }}
                                                >
                                                    {spectatorHandInfo ? (
                                                        <CardFrame cardId={c.id} variant="mini" />
                                                    ) : null}
                                                </div>
                                            );
                                        });
                                    })()}
                                    {p.handCount > 0 && !gameState.spectatorData?.find(sd => sd.playerId === p.id) && (
                                        <div className="opponent-hand-badge">{p.handCount}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="zone-5-trash" onClick={() => setActiveOverlay(prev => prev?.type === 'TRASH' ? null : { type: 'TRASH' })}>ÉCART ({pub.trash.length})</div>
                </div>

                <div className="zone-11-kingdom" style={{ position: 'relative' }}>

                    <AnimatePresence>
                        {(() => {
                            // 0. SMART OVERLAY (High Priority Universal UI)
                            const smartProps = pendingDecision ? mapDecisionToOverlayProps(pendingDecision as any, pub as any) : null;
                            if (smartProps) {
                                return (
                                    <DraggableWindow
                                        title={smartProps.sourceName}
                                        initialX={window.innerWidth / 2 - 450}
                                        initialY={100}
                                        initialWidth={900}
                                        initialHeight={600}
                                        onClose={() => { if (pendingDecision?.optional) handlePass(); }}
                                        showCloseButton={!!pendingDecision?.optional}
                                    >
                                        <SmartCardOverlay
                                            {...smartProps}
                                            onConfirm={(result) => {
                                                if (!pendingDecision) return;
                                                // Handle universal composite response
                                                if (result.type === 'COMPOSITE_RESPONSE') {
                                                    onSendDecision(pendingDecision.id, result);
                                                } else {
                                                    // Legacy or fallback
                                                    onSendDecision(pendingDecision.id, {
                                                        type: 'CARDS',
                                                        cardInstanceIds: result.selectedIds || []
                                                    });
                                                }
                                            }}
                                        />
                                    </DraggableWindow>
                                );
                            }

                            // 1. INFO OVERLAYS (Trash, Duration, Set Aside) - Controlled by activeOverlay
                            if (activeOverlay) {
                                return (
                                    <>
                                        {/* Backdrop for click-outside-to-close */}
                                        <div
                                            className="overlay-backdrop"
                                            onClick={() => setActiveOverlay(null)}
                                            style={{
                                                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                                                background: 'rgba(0,0,0,0.3)', zIndex: 900 // Below window (1000)
                                            }}
                                        />

                                        {(() => {
                                            if (activeOverlay.type === 'TRASH') {
                                                return (
                                                    <DraggableWindow
                                                        key="trash"
                                                        title={`Écart (${pub.trash.length} cartes)`}
                                                        initialX={window.innerWidth / 2 - 400}
                                                        initialY={150}
                                                        initialWidth={800}
                                                        initialHeight={500}
                                                        onClose={() => setActiveOverlay(null)}
                                                    >
                                                        <UniversalOverlay
                                                            mode="GRID"
                                                            title={`Écart (${pub.trash.length} cartes)`}
                                                            cards={pub.trash}
                                                        />
                                                    </DraggableWindow>
                                                );
                                            }
                                            if (activeOverlay.type === 'DURATION') {
                                                const targetPlayer = pub.players.find(p => p.id === activeOverlay.playerId);
                                                if (targetPlayer) {
                                                    const cards = targetPlayer.id === playerId ? (myPlayer?.playArea || []) : (targetPlayer.playArea || []);
                                                    const durationCards = cards.filter((c: any) => {
                                                        const def = CardRegistry.get(c.id);
                                                        const isDuration = def?.types.includes('DURATION');
                                                        const isOld = c.turnPlayed !== undefined ? c.turnPlayed < pub.turnNumber : true;
                                                        return isDuration && (!c.isResolved || (c.durationTurns !== undefined && c.durationTurns > 0)) && isOld;
                                                    });
                                                    const title = targetPlayer.id === playerId ? `Vos Effets Durables` : `Effets Durables - ${targetPlayer.name}`;
                                                    return (
                                                        <DraggableWindow
                                                            key="duration"
                                                            title={title}
                                                            initialX={window.innerWidth / 2 - 300}
                                                            initialY={window.innerHeight / 2 - 200}
                                                            initialWidth={600}
                                                            initialHeight={400}
                                                            onClose={() => setActiveOverlay(null)}
                                                        >
                                                            <UniversalOverlay
                                                                mode="GRID"
                                                                title={title}
                                                                cards={durationCards}
                                                            />
                                                        </DraggableWindow>
                                                    );
                                                }
                                            }
                                            if (activeOverlay.type === 'SET_ASIDE') {
                                                const myDurations = (myPlayer?.playArea || []).filter((c: any) => {
                                                    const def = CardRegistry.get(c.id);
                                                    const isDuration = def?.types.includes('DURATION');
                                                    const isOld = c.turnPlayed !== undefined ? c.turnPlayed < pub.turnNumber : true;
                                                    return isDuration && (!c.isResolved || (c.durationTurns !== undefined && c.durationTurns > 0)) && isOld;
                                                });
                                                const setAsideCards = [
                                                    ...(myPlayer?.aside || []),
                                                    ...myDurations.flatMap((c: any) => c.linkedCards || [])
                                                ];

                                                return (
                                                    <DraggableWindow
                                                        key="setaside"
                                                        title="Cartes Mises de Côté"
                                                        initialX={window.innerWidth / 2 - 250}
                                                        initialY={window.innerHeight / 2 - 150}
                                                        initialWidth={500}
                                                        initialHeight={350}
                                                        onClose={() => setActiveOverlay(null)}
                                                    >
                                                        <UniversalOverlay
                                                            mode="GRID"
                                                            title="Cartes Mises de Côté"
                                                            cards={setAsideCards as any[]}
                                                        />
                                                    </DraggableWindow>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </>
                                );
                            }

                            // 2. DECISION OVERLAYS (Selection, Reorder, Insert, Reveal) - Independent of activeOverlay info windows?
                            // Or should they supersede? Usually decision overlays are modal and mandatory.
                            // We keep them separate below, BUT note that AnimatePresence allows multiple children.
                            // If we return here, we hide them.
                            // Decision overlays should likely take precedence or coexist (but DraggableWindow handles stacking).

                            // To keep logic clean, we return decision overlays IF valid, else null.
                            // BUT wait, if we returned above, we skip this check.
                            // We should restructure:
                            // The Info Overlay is ONE element.
                            // Decision Overlays are OTHER elements.
                            // Since AnimatePresence expects an array or single, we can render both if needed, OR just prioritize Decision.

                            // Current structure in original code was: AnimatePresence { (() => { if(trash)... if(decision)... })() }
                            // This meant ONLY ONE overlay at a time.
                            // If we want Info Overlay to be viewable while Decision is active (unlikely as decision blocks), we can separate.
                            // But usually decision prompt blocks everything.
                            // So let's keep the "One Active Overlay" logic, but prioritize Decision over Info.

                            if (isZoneSearch && pendingDecision) {
                                return (
                                    <DraggableWindow
                                        title={pendingDecision.message}
                                        initialX={window.innerWidth / 2 - 450}
                                        initialY={100}
                                        initialWidth={900}
                                        initialHeight={600}
                                        onClose={() => handleCancelSelection()}
                                    >
                                        <UniversalOverlay
                                            mode={isReorderMode ? 'REORDER' : 'GRID'}
                                            title={pendingDecision.message}
                                            cards={inspectorCards}
                                            selectedIds={selectedCards.map(c => c.id)}
                                            onToggleCard={(id, cardId) => toggleHandSelection(id, cardId)}
                                            filter={pendingDecision.constraints?.filter}
                                            onConfirmOrder={(orderedIds) => onSendDecision(pendingDecision.id, { type: 'CARDS', cardInstanceIds: orderedIds })}
                                        />
                                        {isSelectionMode && (
                                            <SelectionTray
                                                selectedCards={selectedCards}
                                                onRemove={(id) => handleRemoveSelection(id)}
                                                min={pendingDecision?.constraints?.min}
                                                max={pendingDecision?.constraints?.max}
                                                onConfirm={() => handleConfirm()}
                                                onCancel={handleCancelSelection}
                                                isValid={isValid}
                                                confirmText="Valider"
                                            />
                                        )}
                                    </DraggableWindow>
                                );
                            }

                            // Legacy Sentry blocks removed - now handled by SmartCardOverlay via mapDecisionToOverlayProps


                            if (pendingDecision && (pendingDecision.type === PromptType.REORDER || pendingDecision.type === 'REORDER')) {
                                const reorderCards = inspectorCards.length > 0 ? inspectorCards : (pub.players.find(p => p.id === playerId)?.aside || []);
                                return (
                                    <DraggableWindow
                                        title={pendingDecision.message}
                                        initialX={window.innerWidth / 2 - 450}
                                        initialY={150}
                                        initialWidth={900}
                                        initialHeight={450}
                                        onClose={() => { }} // Mandatory prompt
                                        showCloseButton={false}
                                    >
                                        <UniversalOverlay
                                            mode="REORDER"
                                            title={pendingDecision.message}
                                            cards={reorderCards}
                                            onConfirmOrder={(orderedIds) => onSendDecision(pendingDecision.id, { type: 'CARDS', cardInstanceIds: orderedIds })}
                                        />
                                    </DraggableWindow>
                                );
                            }

                            if (pendingDecision && pendingDecision.type === PromptType.DECK_INSERTION) {
                                return (
                                    <DraggableWindow
                                        title={pendingDecision.message}
                                        initialX={window.innerWidth / 2 - 500}
                                        initialY={150}
                                        initialWidth={1000}
                                        initialHeight={500}
                                        onClose={() => { }} // Mandatory prompt
                                        showCloseButton={false}
                                    >
                                        <UniversalOverlay
                                            mode="INSERT"
                                            title={pendingDecision.message}
                                            cardToInsert={pendingDecision.context.cardToMove}
                                            deckCount={pendingDecision.context.deckCount}
                                            onConfirmInsert={(index) => onSendDecision(pendingDecision.id, { type: 'CARDS', index: index })}
                                        />
                                    </DraggableWindow>
                                );
                            }

                            if (pub.revealedCards) {
                                return (
                                    <DraggableWindow
                                        title={pub.revealedCards.cause || "Révélation"}
                                        initialX={window.innerWidth / 2 - 400}
                                        initialY={200}
                                        initialWidth={800}
                                        initialHeight={500}
                                        onClose={onAcknowledgeReveal}
                                    >
                                        <UniversalOverlay
                                            mode="REVEAL"
                                            title={pub.revealedCards.cause || "Révélation"}
                                            cards={pub.revealedCards.cards}
                                            onAcknowledge={onAcknowledgeReveal}
                                            autoHideDuration={pub.revealedCards.autoHide ? 3000 : undefined}
                                            highlightedIds={pub.revealedCards.highlightedIds}
                                        />
                                    </DraggableWindow>
                                );
                            }

                            return null;
                        })()}
                    </AnimatePresence>

                    {/* REMOVED SEPARATE ANCHORS FOR DURATION & SET ASIDE - Now handled above */}

                    {/* Selection Tray - Floating Draggable Window (When NOT in Zone Search AND NOT Supply Selection) */}
                    <AnimatePresence>
                        {isSelectionMode && !isZoneSearch && pendingDecision?.constraints?.sourceZone !== 'supply' && (
                            <DraggableWindow
                                title={pendingDecision?.message ?? "Sélection"}
                                initialX={window.innerWidth / 2 - 450}
                                initialY={window.innerHeight / 2 - 150}
                                initialWidth={900}
                                initialHeight={300}
                                onClose={handleCancelSelection}
                            >
                                <SelectionTray
                                    selectedCards={selectedCards}
                                    onRemove={(id) => handleRemoveSelection(id)}
                                    min={pendingDecision?.constraints?.min}
                                    max={pendingDecision?.constraints?.max}
                                    onConfirm={() => handleConfirm()}
                                    onCancel={handleCancelSelection}
                                    isValid={isValid}
                                    confirmText="Valider"
                                />
                            </DraggableWindow>
                        )}
                    </AnimatePresence>

                    {/* Supply Grid - ALWAYS VISIBLE */}
                    {activeOverlay?.type !== 'TRASH' &&
                        !(pendingDecision?.type === PromptType.REORDER || pendingDecision?.type === 'REORDER' || pendingDecision?.type === PromptType.DECK_INSERTION) && (
                            <div className="kingdom-with-side-supply">
                                {pub.nonSupply && Object.keys(pub.nonSupply).length > 0 && (
                                    <SideSupplyBar nonSupply={pub.nonSupply} />
                                )}
                                <SupplyGrid
                                    supply={pub.supply}
                                    variant="kingdom"
                                    onBuy={onBuyCard}
                                    canBuy={isMyTurn && pub.phase === 'BUY' && (myPlayer?.buys ?? 0) > 0}
                                    coins={myPlayer?.coins ?? 0}
                                    costReduction={myPlayer?.costReduction ?? 0}
                                    pendingDecision={pendingDecision}
                                    onChoose={onSendDecision}
                                    onToggleSupply={isSelectionMode ? handleSupplySelection : undefined}
                                    selectedDetails={selectedCards.filter(c => c.source === 'SUPPLY').map(c => c.cardId)}
                                    landscapes={pub.landscapes}
                                />
                            </div>
                        )}
                </div>

                <div className="zone-12-play-area">
                    {pub.phase === 'PREGAME' && !myPlayer?.isReady && (
                        <button className="ready-btn-medieval" onClick={onToggleReady}>PRÊT</button>
                    )}
                    <AnimatePresence>
                        {(() => {
                            const playGroups: { id: string; instances: any[] }[] = [];
                            currentPlayer?.playArea.forEach((c: any) => {
                                // Filter out ACTIVE duration cards (as they are shown in DurationView)
                                const def = CardRegistry.get(c.id);
                                const isDuration = def?.types.includes('DURATION');
                                // Persistent if it's a duration AND (not resolved OR has durationTurns > 0)
                                const isPersistent = isDuration && (!c.isResolved || (c.durationTurns !== undefined && c.durationTurns > 0));

                                // HIDE from Play Area ONLY if it is Persistent AND Old (played in previous turn)
                                // If it is "fresh" (played this turn), Show it here.
                                const isOld = c.turnPlayed !== undefined ? c.turnPlayed < pub.turnNumber : isPersistent; // Fallback: if no turnPlayed, assume old if persistent

                                if (isPersistent && isOld) return; // Skip, it's in the specialized view

                                const group = playGroups.find(g => g.id === c.id);
                                if (group) group.instances.push(c);
                                else playGroups.push({ id: c.id, instances: [c] });
                            });

                            return playGroups.map((group, i) => (
                                <AnimatedCard
                                    key={`${group.id}-${i}`}
                                    cardId={group.id}
                                    instanceId={group.instances[0].instanceId}
                                    index={i}
                                    variant="full"
                                    showCount={group.instances.length > 1}
                                    count={group.instances.length}
                                />
                            ));
                        })()}
                    </AnimatePresence>

                    {/* Choice Overlay removed - now in Action Bar */}

                </div>


                <div className="action-bar-zone">
                    {(() => {
                        const isPhaseEnd = !pendingDecision && isMyTurn;
                        const hasTreasures = isPhaseEnd && priv?.hand.some((c: any) => CardRegistry.get(c.id)?.types.includes('TREASURE'));

                        // Hide the ActionBar confirm button when SmartCardOverlay is handling the decision
                        // (it has its own built-in Confirmer button)
                        const isSmartOverlayActive = pendingDecision?.type === PromptType.SENTRY_INTERACTION || pendingDecision?.type === PromptType.COMPOSITE_FILTER;
                        const showConfirm = !isSmartOverlayActive && pendingDecision?.constraints?.sourceZone !== 'SUPPLY';

                        return (
                            <ActionBar
                                // Game State
                                phase={pub.phase}
                                turnNumber={currentPlayer?.turnNumber ?? 1}
                                currentPlayerName={currentPlayer?.name ?? ''}
                                currentPlayerColor={currentPlayer?.color ?? '#fff'}
                                isMyTurn={isMyTurn}
                                isWaiting={isWaiting}
                                actions={currentPlayer?.actions ?? 0}
                                buys={currentPlayer?.buys ?? 0}
                                coins={currentPlayer?.coins ?? 0}

                                // Decisions
                                instruction={instructionText}
                                hasPendingDecision={!!isMyChoice}
                                isValid={isValid}
                                canPass={pendingDecision?.optional ?? false}
                                confirmText={pendingDecision ? "Valider" : "Terminer"}

                                // Handlers
                                onPlayTreasures={hasTreasures ? onPlayAllTreasures : undefined}
                                onConfirm={handleConfirm}
                                onPass={handlePass}
                                // Options handling
                                onChooseOption={handleChooseOption}
                                onSubmitOptions={handleSubmitOptions}
                                options={isMyChoice && pendingDecision?.type === PromptType.SELECT_OPTION ? (pendingDecision.options || pendingDecision.context?.options) : undefined}
                                selectedOptionIndices={selectedOptionIndices}
                                maxOptions={isMyChoice && pendingDecision?.type === PromptType.SELECT_OPTION ? (pendingDecision.constraints?.max || 1) : 1}

                                // Hide confirm button for Supply selection (immediate interaction)
                                showConfirm={showConfirm && (pendingDecision?.type !== PromptType.CHOOSE_CARDS || !isHandLocked)}
                                onEndPhase={onEndPhase}
                                onPayDebt={onPayDebt}
                                tokens={myPlayer?.tokens ?? {}}
                            />
                        );
                    })()}
                </div>

                <div
                    className={`zone-14-hand ${isInteractionLocked || isHandLocked ? 'zone-locked' : ''}`}
                    ref={(el) => registerTarget('hand', el)} // REGISTER HAND TARGET
                >
                    <AnimatePresence>
                        {(() => {
                            // Group ALL cards first (including hidden ones) to maintain stable counts
                            const handGroups: { id: string; instances: any[]; visibleInstances: any[] }[] = [];
                            priv?.hand.forEach((c: any) => {
                                const group = handGroups.find(g => g.id === c.id);
                                const isHidden = hiddenIds.has(c.instanceId);

                                if (group) {
                                    group.instances.push(c);
                                    if (!isHidden) group.visibleInstances.push(c);
                                } else {
                                    handGroups.push({
                                        id: c.id,
                                        instances: [c],
                                        visibleInstances: isHidden ? [] : [c]
                                    });
                                }
                            });

                            // Stable Sort: Cost > Name > ID
                            // This prevents "jumping" when cards are played and the server reorders the remaining array.
                            handGroups.sort((a, b) => {
                                const defA = CardRegistry.get(a.id);
                                const defB = CardRegistry.get(b.id);
                                // 1. Cost (Ascending)
                                const costA = defA?.cost ?? 0;
                                const costB = defB?.cost ?? 0;
                                if (costA !== costB) return costA - costB;
                                // 2. Name (Alphabetical)
                                const nameA = defA?.name ?? '';
                                const nameB = defB?.name ?? '';
                                if (nameA !== nameB) return nameA.localeCompare(nameB);
                                // 3. ID (Fallback)
                                return a.id.localeCompare(b.id);
                            });

                            // Filter out groups with no visible instances (all hidden = animating)
                            return handGroups.filter(g => g.visibleInstances.length > 0).map((group, i) => {
                                const filter = pendingDecision?.constraints?.filter;
                                const instances = group.instances; // Use ALL instances for logic
                                const visibleInstances = group.visibleInstances; // Use visible for display

                                // Calculate selection count and filtered status

                                let isFiltered = false;
                                if (isSelectionMode && filter) {
                                    if (filter.cardIds && !filter.cardIds.includes(group.id)) isFiltered = true;
                                    if (filter.cardTypes) {
                                        const def = CardRegistry.get(group.id);
                                        if (def && !filter.cardTypes.some((t: string) => def.types.includes(t as any))) isFiltered = true;
                                    }
                                    if (filter.maxCost !== undefined) {
                                        const def = CardRegistry.get(group.id);
                                        if (def && def.cost > filter.maxCost) isFiltered = true;
                                    }
                                    const sourceZone = pendingDecision?.constraints?.sourceZone;
                                    if (sourceZone && sourceZone !== 'hand') isFiltered = true;
                                }

                                const handleStackedClick = () => {
                                    if (isFiltered || isHandLocked) return;

                                    if (isSelectionMode) {
                                        // In selection mode, find an unselected VISIBLE instance to toggle
                                        const unselected = visibleInstances.find(inst => !selectedCards.some(s => s.id === inst.instanceId));
                                        if (unselected) {
                                            toggleHandSelection(unselected.instanceId, group.id);
                                        } else if (visibleInstances.length > 0) {
                                            // All visible are selected, toggle the last visible one
                                            toggleHandSelection(visibleInstances[visibleInstances.length - 1].instanceId, group.id);
                                        }
                                    } else if (isMyTurn) {
                                        const def = CardRegistry.get(group.id);
                                        const isAction = def?.types.includes('ACTION') || def?.types.includes('ATTACK') || def?.types.includes('REACTION');
                                        const isTreasure = def?.types.includes('TREASURE');

                                        if ((pub.phase === 'ACTION' && isAction) || ((pub.phase === 'ACTION' || pub.phase === 'BUY') && isTreasure)) {
                                            const currentPending = pendingPlayIdsRef.current;

                                            // Find first available VISIBLE instance that isn't already pending
                                            // PRIORITIZE: Cards not selected in tray (though play should interact with hand directly)
                                            const targetInstance = visibleInstances.find(inst =>
                                                !currentPending.has(inst.instanceId) &&
                                                !selectedCards.some(s => s.id === inst.instanceId)
                                            );

                                            if (targetInstance) {
                                                pendingPlayIdsRef.current.add(targetInstance.instanceId);
                                                onPlayCard(targetInstance.instanceId);
                                            }
                                        }
                                    }
                                };

                                // Determine if this group is partially or fully selected
                                const firstSelectedIndex = selectedCards.findIndex(s => instances.some(inst => inst.instanceId === s.id));
                                const isGroupSelected = firstSelectedIndex !== -1;

                                // Restore Playable Logic
                                const def = CardRegistry.get(group.id);
                                const isAction = def?.types.includes('ACTION') || def?.types.includes('ATTACK') || def?.types.includes('REACTION');
                                const isTreasure = def?.types.includes('TREASURE');
                                const isPlayable = !isHandLocked && !isSelectionMode && isMyTurn && (
                                    (pub.phase === 'ACTION' && isAction) ||
                                    ((pub.phase === 'ACTION' || pub.phase === 'BUY') && isTreasure)
                                );

                                return (
                                    <AnimatedCard
                                        key={group.id}
                                        cardId={group.id}
                                        index={i}
                                        variant="full"
                                        showCount={visibleInstances.length > 1}
                                        count={visibleInstances.length}
                                        // Visual State
                                        disabled={isFiltered || isHandLocked}
                                        selected={isGroupSelected}
                                        selectionIndex={isGroupSelected ? firstSelectedIndex : undefined}
                                        dimmed={isGroupSelected}
                                        playable={isPlayable}
                                        onClick={handleStackedClick}
                                    />
                                );
                            });
                        })()}
                    </AnimatePresence>
                </div>

                {/* PLAYER DURATION & SET ASIDE STACK (Anchored to Bottom Left of Screen/Center Col) */}
                {
                    (() => {
                        const myDurations = (myPlayer?.playArea || []).filter((c: any) => {
                            const def = CardRegistry.get(c.id);
                            const isDuration = def?.types.includes('DURATION');
                            const isOld = c.turnPlayed !== undefined ? c.turnPlayed < pub.turnNumber : true;
                            return isDuration && (!c.isResolved || (c.durationTurns !== undefined && c.durationTurns > 0)) && isOld;
                        });

                        const setAsideCards = [
                            ...(myPlayer?.aside || []),
                            ...(myPlayer?.tavernMat || []),
                            ...myDurations.flatMap((c: any) => c.linkedCards || [])
                        ];

                        return (
                            <div className="duration-stack" style={{
                                position: 'absolute',
                                bottom: '0px', /* Glued to bottom */
                                left: '10px',
                                zIndex: 200, /* High z-index to float over hand */
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                alignItems: 'flex-start',
                                paddingBottom: '10px' /* Small padding from very edge */
                            }}>
                                {/* Generic Tokens */}
                                {myPlayer?.tokens && <TokenDisplay tokens={myPlayer.tokens} />}

                                {/* Specialized Mats */}
                                {myPlayer?.tavernMat && myPlayer.tavernMat.length > 0 && (
                                    <TavernMat
                                        cards={myPlayer.tavernMat as any[]}
                                        isMyTurn={isMyTurn}
                                        onCallCard={(instanceId) => onSendDecision?.('call_reserve', { type: 'CARD', cardInstanceId: instanceId })}
                                    />
                                )}
                                {myPlayer?.exileMat && myPlayer.exileMat.length > 0 && (
                                    <ExileMat cards={myPlayer.exileMat as any[]} />
                                )}

                                {/* Other Generic Mats */}
                                {myPlayer?.mats && Object.entries(myPlayer.mats).map(([name, cards]) => {
                                    if (name === 'tavern' || name === 'exile') return null;
                                    return (
                                        <ZoneContainer
                                            key={name}
                                            name={name}
                                            cards={cards as any[]}
                                            onCardClick={() => {
                                                setActiveOverlay({ type: 'SET_ASIDE' });
                                            }}
                                        />
                                    );
                                })}

                                {/* Duration Display improvement */}
                                {myPlayer?.playArea && pub.durations?.some(d => d.playerId === myPlayer.id) && (
                                    <div className="duration-indicator">
                                        <span className="pulsing-dot"></span>
                                        Effets de durée actifs
                                    </div>
                                )}

                                <SetAsideZone
                                    cards={setAsideCards as any[]}
                                    onClick={() => setActiveOverlay(prev => prev?.type === 'SET_ASIDE' ? null : { type: 'SET_ASIDE' })}
                                    isActive={activeOverlay?.type === 'SET_ASIDE'}
                                />
                                <PlayerDurationZone
                                    cards={myDurations}
                                    onClick={() => setActiveOverlay(prev => prev?.type === 'DURATION' && (prev as any).playerId === playerId ? null : { type: 'DURATION', playerId: playerId || '' })}
                                    isActive={activeOverlay?.type === 'DURATION' && (activeOverlay as any).playerId === playerId}
                                />
                            </div>
                        );
                    })()
                }
            </div >


            {/* Right Column */}
            < div className="layout-col-right" >
                <div className="zone-15-log">
                    <LogView
                        logs={pub.logs}
                        history={pub.history}
                        players={pub.players}
                        myPlayerId={playerId}
                        onRequestRewind={onRequestRewind}
                        rewindMode={rewindMode}
                        selectedLogId={selectedLogId}
                        onSelectLog={handleLogSelect}
                    />
                </div>

                <div className="zone-17-menu">
                    {/* Rewind Button */}
                    <button
                        className={`rewind-mode-btn ${rewindMode ? 'active' : ''}`}
                        onClick={handleRewindToggle}
                        disabled={!isMyTurn}
                        title={!isMyTurn ? "Disponible uniquement durant votre tour" : (rewindMode ? "Annuler le mode retour" : "Revenir en arrière")}
                    >
                        ⏪
                    </button>

                    {/* Confirm Rewind Button */}
                    {rewindMode && selectedLogId && (
                        <button
                            className="confirm-rewind-btn"
                            onClick={handleRewindConfirm}
                            title="Confirmer le retour en arrière"
                        >
                            ✓ CONFIRMER
                        </button>
                    )}

                    <button
                        className="kingdom-menu-btn"
                        onClick={() => setShowKingdomModal(true)}
                        title="Voir tout le royaume"
                    >
                        🏰
                    </button>
                    <button
                        className="volume-btn"
                        onClick={toggleMute}
                        title={isMuted ? "Activer le son" : "Couper le son"}
                    >
                        {isMuted ? '🔇' : '🔊'}
                    </button>
                    <button
                        className="quit-btn"
                        onClick={() => setShowQuitConfirm(true)}
                        title="Quitter"
                    >
                        QUITTER
                    </button>
                </div>
            </div >

            {/* Fallback for standard interaction prompts that are not handled directly by BoardLayout's Drag/Drop overlays */}
            {gameState.public.pendingDecision && (
                ['YES_NO', 'SELECT_OPTION', 'NAME_CARD', 'SELECT_SUPPLY', 'CONFIRM'].includes(gameState.public.pendingDecision.type as string) ||
                gameState.public.pendingDecision.context?.specialAction === 'CHOOSE_OPTION'
            ) && (
                    <ChoiceModal
                        choice={gameState.public.pendingDecision as any}
                        hand={gameState.private?.hand || []}
                        discard={gameState.public.players.find(p => p.id === playerId)?.discardPile || []}
                        revealed={gameState.public.revealedCards?.cards || []}
                        supply={gameState.public.supply}
                        onChoose={onSendDecision}
                    />
                )}

            < ParticleOverlay />

            <KingdomOverviewModal
                isOpen={showKingdomModal}
                onClose={() => setShowKingdomModal(false)}
                gameState={gameState.public}
            />

            {/* Custom Quit Confirmation Modal (High Z-Index) */}
            <AnimatePresence>
                {showQuitConfirm && (
                    <div className="custom-modal-overlay" style={{ zIndex: 10000 }}>
                        <div className="custom-modal-content medieval">
                            <h2 style={{ color: '#e74c3c', marginTop: 0 }}>
                                {isHost ? "⚠️ ARRÊTER LA PARTIE ?" : "QUITTER LA PARTIE ?"}
                            </h2>
                            <p style={{ margin: '20px 0', fontSize: '1.1rem', lineHeight: '1.6' }}>
                                {isHost
                                    ? "En tant qu'hôte, cette action mettra fin à la partie pour TOUS les joueurs et fermera la salle."
                                    : "Vous ne pourrez plus revenir dans cette partie."}
                            </p>
                            <p style={{ fontStyle: 'italic', marginBottom: '30px', opacity: 0.8 }}>
                                Êtes-vous sûr de vouloir continuer ?
                            </p>
                            <div className="modal-actions" style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                                <button
                                    onClick={() => setShowQuitConfirm(false)}
                                    className="menu-btn-medieval"
                                    style={{ padding: '12px 30px', fontSize: '1rem', border: '1px solid #888', color: '#ccc' }}
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={() => {
                                        setShowQuitConfirm(false);
                                        if (isHost) {
                                            onForceEndGame();
                                        } else {
                                            onLeaveGame();
                                        }
                                    }}
                                    className="quit-btn"
                                    style={{ padding: '12px 30px', fontSize: '1rem', background: '#c0392b', color: 'white', border: 'none', fontWeight: 'bold' }}
                                >
                                    CONFIRMER
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};
