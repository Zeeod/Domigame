import React from 'react';
import { SelectionOverlay } from './SelectionOverlay';
import { SmartCardOverlay, mapDecisionToOverlayProps } from './SmartCardOverlay';
import { UniversalOverlay } from './UniversalOverlay';
import { CardFrame } from './CardFrame';
import { CardRegistry } from '../../shared/cards/index';
import { SentryOverlay } from './SentryOverlay';
import './ChoiceModal.css';

// Reuse existing interfaces or define new ones compatible with GameState
interface CardData {
    id: string;
    instanceId: string;
    name: string;
}

interface PendingChoice {
    id: string;
    playerId: string;
    type: string;
    message: string;
    min?: number;
    max?: number;
    options?: any[];
    context?: any;
    cards?: CardData[];
    constraints?: any;
}

interface SupplyPile {
    cardId: string;
    count: number;
    topCardId?: string;
}

interface ChoiceModalProps {
    choice: PendingChoice;
    hand: CardData[];
    discard: CardData[];
    revealed: CardData[];
    supply: Record<string, SupplyPile>;
    onChoose: (choiceId: string, payload: any) => void;
}

export const ChoiceModalV2: React.FC<ChoiceModalProps> = ({
    choice,
    hand,
    discard,
    revealed,
    supply,
    onChoose
}) => {
    const type = choice.type;

    // Helpers
    const handleOption = (index: number) => {
        onChoose(choice.id, { type: 'OPTION', optionIndex: index });
    };

    const handleSupplyChoice = (cardId: string) => {
        onChoose(choice.id, { type: 'SUPPLY', cardId });
    };

    const handleUniversalConfirm = (selectedIds: string[]) => {
        if (type === 'REORDER') {
            onChoose(choice.id, { type: 'REORDER_IDS', order: selectedIds });
        } else {
            onChoose(choice.id, { type: 'CARDS', cardInstanceIds: selectedIds });
        }
    };

    const handleSentryConfirm = (payload: { trash: string[], discard: string[], reorder: string[] }) => {
        onChoose(choice.id, {
            type: 'SENTRY_DECISION',
            ...payload
        });
    };

    const handleCompositeConfirm = (result: any) => {
        onChoose(choice.id, result);
    };

    // --- UNIVERSAL CARD SELECTION (CHOOSE_CARDS, SELECT_CARDS, ZONE_SEARCH, REORDER) ---
    const isUniversalSelection =
        type === 'CHOOSE_CARDS' ||
        type === 'SELECT_CARDS' ||
        type === 'ZONE_SEARCH' ||
        type === 'REORDER';

    if (isUniversalSelection) {
        const mapToInstance = (c: CardData) => ({ id: c.id, instanceId: c.instanceId });
        return (
            <SelectionOverlay
                decision={choice as any}
                playerHand={hand.map(mapToInstance) as any}
                playerDiscard={discard.map(mapToInstance) as any}
                revealedCards={revealed.map(mapToInstance) as any}
                onConfirm={handleUniversalConfirm}
            />
        );
    }

    // --- COMPOSITE FILTER (SmartCardOverlay - multi-bucket drag & drop) ---
    if (type === 'COMPOSITE_FILTER') {
        const overlayProps = mapDecisionToOverlayProps(choice as any, null as any);
        if (overlayProps) {
            return (
                <div className="choice-modal-overlay">
                    <SmartCardOverlay
                        {...overlayProps}
                        onConfirm={handleCompositeConfirm}
                    />
                </div>
            );
        }
    }

    // --- SENTRY (SENTRY_INTERACTION) ---
    if (type === 'SENTRY_INTERACTION') {
        const mapToInstance = (c: CardData) => ({ id: c.id, instanceId: c.instanceId });
        const sentryCards = (choice.context?.cards || choice.cards || revealed).map(mapToInstance);
        return (
            <div className="choice-modal-overlay">
                <SentryOverlay
                    cards={sentryCards as any}
                    onComplete={handleSentryConfirm}
                />
            </div>
        );
    }

    // --- DECK INSERTION (UniversalOverlay INSERT mode) ---
    if (type === 'DECK_INSERTION') {
        const mapToInstance = (c: CardData) => ({ id: c.id, instanceId: c.instanceId });
        const cardToInsert = choice.context?.card
            ? mapToInstance(choice.context.card)
            : null;
        const deckCount = choice.context?.deckCount ?? 0;

        return (
            <div className="choice-modal-overlay">
                <div className="choice-modal">
                    <div className="choice-header">
                        <h2>{choice.message || 'Où insérer la carte ?'}</h2>
                    </div>
                    <UniversalOverlay
                        mode="INSERT"
                        title={choice.message || 'Insertion dans la pioche'}
                        cardToInsert={cardToInsert as any}
                        deckCount={deckCount}
                        onConfirmInsert={(index) => {
                            onChoose(choice.id, { type: 'INSERT_AT', index });
                        }}
                    />
                </div>
            </div>
        );
    }

    // --- YES/NO (YES_NO prompt type) ---
    if (type === 'YES_NO') {
        return (
            <div className="choice-modal-overlay">
                <div className="choice-modal yes-no-modal">
                    <div className="choice-header">
                        <h2>{choice.message}</h2>
                    </div>
                    <div className="choice-options-list yes-no-options">
                        <button
                            className="option-button medieval yes-btn"
                            onClick={() => onChoose(choice.id, { type: 'YES_NO', value: true })}
                        >
                            ✅ Oui
                        </button>
                        <button
                            className="option-button medieval no-btn"
                            onClick={() => onChoose(choice.id, { type: 'YES_NO', value: false })}
                        >
                            ❌ Non
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- CONFIRM (acknowledge) ---
    if (type === 'CONFIRM') {
        return (
            <div className="choice-modal-overlay">
                <div className="choice-modal confirm-modal">
                    <div className="choice-header">
                        <h2>{choice.message}</h2>
                    </div>
                    <div className="choice-options-list">
                        <button
                            className="option-button medieval"
                            onClick={() => onChoose(choice.id, { type: 'CONFIRM' })}
                        >
                            ✅ OK
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- NAME_CARD (type a card name) ---
    if (type === 'NAME_CARD') {
        return (
            <NameCardModal
                choice={choice}
                onChoose={onChoose}
            />
        );
    }

    // --- SELECT_OPTION / CHOOSE_OPTION ---
    const isOption = type === 'SELECT_OPTION' || choice.context?.specialAction === 'CHOOSE_OPTION';
    if (isOption) {
        return (
            <div className="choice-modal-overlay">
                <div className="choice-modal option-selection-modal">
                    <div className="choice-header">
                        <h2>{choice.message}</h2>
                    </div>
                    <div className="choice-options-list">
                        {(choice.options || []).map((opt: any, idx: number) => {
                            const label = typeof opt === 'string' ? opt : opt.label;
                            const isCardOption = !!CardRegistry.get(label);

                            return (
                                <div key={idx} className="option-item" onClick={() => handleOption(idx)}>
                                    {isCardOption ? (
                                        <CardFrame
                                            cardId={label}
                                            variant="mini"
                                            isSelectable={true}
                                        />
                                    ) : (
                                        <button className="option-button medieval">
                                            {label}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // --- SELECT_SUPPLY ---
    if (type === 'SELECT_SUPPLY') {
        return (
            <div className="choice-modal-overlay">
                <div className="choice-modal supply-selection-modal">
                    <div className="choice-header">
                        <h2>{choice.message}</h2>
                    </div>
                    <div className="choice-supply-grid">
                        {Object.entries(supply)
                            .filter(([_, pile]) => pile.count > 0)
                            .map(([cardId, pile]) => (
                                <div key={cardId} className="supply-option-wrapper">
                                    <CardFrame
                                        cardId={pile.topCardId || cardId}
                                        variant="mini"
                                        showCost={true}
                                        count={pile.count}
                                        showCount={true}
                                        isSelectable={true}
                                        onClick={() => handleSupplyChoice(cardId)}
                                    />
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
        );
    }

    // Fallback: unknown type - show a diagnostic message in dev
    if (process.env.NODE_ENV === 'development') {
        console.warn(`[ChoiceModalV2] Unhandled choice type: "${type}"`, choice);
    }

    return null;
};

// --- Sub-component for NAME_CARD ---
const NameCardModal: React.FC<{ choice: any; onChoose: (id: string, payload: any) => void }> = ({ choice, onChoose }) => {
    const [query, setQuery] = React.useState('');
    const [suggestions, setSuggestions] = React.useState<string[]>([]);

    const handleInput = (val: string) => {
        setQuery(val);
        if (val.length < 2) {
            setSuggestions([]);
            return;
        }
        const lower = val.toLowerCase();
        // Search CardRegistry for matching cards
        const allIds: string[] = (CardRegistry as any).getAllIds?.() ?? [];
        const matches = allIds
            .filter((id: string) => {
                const def = CardRegistry.get(id);
                return def?.name?.toLowerCase().includes(lower);
            })
            .slice(0, 8);
        setSuggestions(matches);
    };

    const confirm = (cardId: string) => {
        onChoose(choice.id, { type: 'NAMED_CARD', cardId });
    };

    return (
        <div className="choice-modal-overlay">
            <div className="choice-modal name-card-modal">
                <div className="choice-header">
                    <h2>{choice.message || 'Nommez une carte'}</h2>
                </div>
                <div className="name-card-input-area">
                    <input
                        autoFocus
                        type="text"
                        className="name-card-input"
                        placeholder="Tapez un nom de carte..."
                        value={query}
                        onChange={(e) => handleInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && suggestions.length > 0) confirm(suggestions[0]);
                        }}
                    />
                    {suggestions.length > 0 && (
                        <div className="name-card-suggestions">
                            {suggestions.map(id => {
                                const def = CardRegistry.get(id);
                                return (
                                    <div
                                        key={id}
                                        className="name-card-suggestion-item"
                                        onClick={() => confirm(id)}
                                    >
                                        <CardFrame cardId={id} variant="mini" isSelectable />
                                        <span>{def?.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
