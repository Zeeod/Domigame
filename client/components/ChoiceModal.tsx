/**
 * ChoiceModal - Modal for player choices (trash, discard, gain)
 */

import React, { useState } from 'react';
import './ChoiceModal.css';

interface CardData {
    id: string;
    instanceId: string;
    name: string;
}

interface PendingChoice {
    id: string;
    playerId: string;
    type: string;
    prompt: string;
    min?: number;
    max?: number;
    options?: string[];
}

interface SupplyPile {
    cardId: string;
    count: number;
}

interface ChoiceModalProps {
    choice: PendingChoice;
    hand: CardData[];
    supply: Record<string, SupplyPile>;
    onChoose: (choiceId: string, payload: any) => void;
}

export const ChoiceModal: React.FC<ChoiceModalProps> = ({
    choice,
    hand,
    supply,
    onChoose
}) => {
    const [selectedCards, setSelectedCards] = useState<string[]>([]);

    const toggleCard = (instanceId: string) => {
        setSelectedCards(prev => {
            if (prev.includes(instanceId)) {
                return prev.filter(id => id !== instanceId);
            }
            if (choice.max && prev.length >= choice.max) {
                return prev;
            }
            return [...prev, instanceId];
        });
    };

    const handleConfirm = () => {
        if (choice.type === 'SELECT_CARDS') {
            onChoose(choice.id, { type: 'CARDS', cardInstanceIds: selectedCards });
        }
    };

    const handleSupplyChoice = (cardId: string) => {
        onChoose(choice.id, { type: 'SUPPLY', cardId });
    };

    const canConfirm = () => {
        const min = choice.min ?? 0;
        return selectedCards.length >= min;
    };

    return (
        <div className="choice-modal-overlay">
            <div className="choice-modal">
                <h2>{choice.prompt}</h2>

                {choice.type === 'SELECT_CARDS' && (
                    <>
                        <div className="choice-cards">
                            {hand.map(card => (
                                <div
                                    key={card.instanceId}
                                    className={`choice-card ${selectedCards.includes(card.instanceId) ? 'selected' : ''}`}
                                    onClick={() => toggleCard(card.instanceId)}
                                >
                                    <span className="card-name">{card.name}</span>
                                </div>
                            ))}
                        </div>

                        <div className="choice-info">
                            Sélectionné: {selectedCards.length}
                            {choice.min !== undefined && ` (min: ${choice.min})`}
                            {choice.max !== undefined && ` (max: ${choice.max})`}
                        </div>

                        <button
                            className="confirm-button"
                            onClick={handleConfirm}
                            disabled={!canConfirm()}
                        >
                            Confirmer
                        </button>
                    </>
                )}

                {choice.type === 'SELECT_SUPPLY' && (
                    <div className="choice-supply">
                        {Object.entries(supply)
                            .filter(([_, pile]) => pile.count > 0)
                            .map(([cardId, pile]) => (
                                <div
                                    key={cardId}
                                    className="supply-choice-card"
                                    onClick={() => handleSupplyChoice(cardId)}
                                >
                                    {getCardName(cardId)} ({pile.count})
                                </div>
                            ))
                        }
                    </div>
                )}
            </div>
        </div>
    );
};

function getCardName(cardId: string): string {
    const names: Record<string, string> = {
        copper: 'Cuivre', silver: 'Argent', gold: 'Or',
        estate: 'Domaine', duchy: 'Duché', province: 'Province',
        village: 'Village', smithy: 'Forgeron', market: 'Marché',
        militia: 'Milice', chapel: 'Chapelle'
    };
    return names[cardId] ?? cardId;
}
