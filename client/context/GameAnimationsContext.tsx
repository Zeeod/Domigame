import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardFrame } from '../components/CardFrame';
import { soundManager } from '../managers/SoundManager';

interface FlyingCard {
    id: string; // Unique animation ID
    cardId: string;
    instanceId?: string; // For hiding the specific instance in hand
    startRect: DOMRect;
    target: 'discard' | 'deck' | 'hand' | 'trash';
    delay?: number;
}

interface GameAnimationsContextType {
    playGainAnimation: (cardId: string, instanceId: string | undefined, startRect: DOMRect, target?: 'discard' | 'deck' | 'hand' | 'trash') => void;
    playShuffleAnimation: (startRect: DOMRect, targetRect: DOMRect) => void;
    registerTarget: (name: string, element: HTMLElement | null) => void;
    hiddenIds: Set<string>; // IDs of cards currently animating
}

const GameAnimationsContext = createContext<GameAnimationsContextType | null>(null);

export const useGameAnimations = () => {
    const context = useContext(GameAnimationsContext);
    if (!context) throw new Error('useGameAnimations must be used within GameAnimationsProvider');
    return context;
};

export const GameAnimationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [flyingCards, setFlyingCards] = useState<FlyingCard[]>([]);
    const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
    const targetsRef = useRef<Record<string, HTMLElement>>({});

    const registerTarget = useCallback((name: string, element: HTMLElement | null) => {
        if (element) {
            targetsRef.current[name] = element;
        } else {
            delete targetsRef.current[name];
        }
    }, []);

    const playGainAnimation = useCallback((cardId: string, instanceId: string | undefined, startRect: DOMRect, target: 'discard' | 'deck' | 'hand' | 'trash' = 'discard') => {
        const id = `fly-${Date.now()}-${Math.random()}`;
        setFlyingCards(prev => [...prev, { id, cardId, instanceId, startRect, target }]);
        soundManager.play('card_gain', 0.4);

        // Hide the card in destination if it has an instanceId (e.g. going to hand)
        if (instanceId && target === 'hand') {
            setHiddenIds(prev => {
                const next = new Set(prev);
                next.add(instanceId);
                return next;
            });
        }

        // Auto-remove after animation
        const duration = 1200; // Match animation duration
        setTimeout(() => {
            setFlyingCards(prev => prev.filter(c => c.id !== id));
            // Unhide
            if (instanceId && target === 'hand') {
                setHiddenIds(prev => {
                    const next = new Set(prev);
                    next.delete(instanceId);
                    return next;
                });
            }
        }, duration);
    }, []);

    const playShuffleAnimation = useCallback((startRect: DOMRect) => {
        // Trigger a burst of cards flying from Discard to Deck
        soundManager.play('shuffle', 0.4);
        const count = 5;
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const id = `shuffle-${Date.now()}-${i}`;
                // Use a generic card back or a specific card ID if available
                // Here we use 'copper' as a placeholder, but in a real shuffle it's face down anyway
                setFlyingCards(prev => [...prev, {
                    id,
                    cardId: 'copper', // Placeholder
                    startRect,
                    target: 'deck'
                }]);

                // Remove after animation
                setTimeout(() => {
                    setFlyingCards(prev => prev.filter(c => c.id !== id));
                }, 1000);
            }, i * 150);
        }
    }, []);

    return (
        <GameAnimationsContext.Provider value={{ playGainAnimation, playShuffleAnimation, registerTarget, hiddenIds }}>
            {children}
            <FlyingCardsLayer cards={flyingCards} targets={targetsRef.current} />
        </GameAnimationsContext.Provider>
    );
};

// --- Layer Component ---
const FlyingCardsLayer: React.FC<{ cards: FlyingCard[]; targets: Record<string, HTMLElement> }> = ({ cards, targets }) => {
    return (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
            <AnimatePresence>
                {cards.map(card => {
                    const targetEl = targets[card.target];
                    if (!targetEl) return null;

                    const endRect = targetEl.getBoundingClientRect();

                    // Logic for Arc:
                    // If going to hand, we want a nice arc upwards.
                    // Midpoint X is average. Midpoint Y is higher (smaller value) than both start and end.
                    const startX = card.startRect.left + card.startRect.width / 2;
                    const startY = card.startRect.top;
                    // Target center of the destination zone instead of left edge
                    const endX = endRect.left + endRect.width / 2 - card.startRect.width / 2;
                    const endY = endRect.top + endRect.height / 2 - card.startRect.height / 2;

                    // Calculate a control point for the arc
                    // A simple way is to use keyframes that overshoot Y constraints
                    // Let's just arc "up" by 150px relative to the highest point
                    const minY = Math.min(startY, endY);
                    const arcHeight = 150;
                    const midY = minY - arcHeight;

                    // Rotation logic: if coming from Deck/Trash (shuffled), flip it.
                    // Start face down (rotateY 180) -> End face up (rotateY 0)
                    const initialRotateY = (card.target === 'hand') ? 180 : 0;

                    return (
                        <motion.div
                            key={card.id}
                            initial={{
                                position: 'absolute',
                                left: startX,
                                top: startY,
                                width: card.startRect.width,
                                height: card.startRect.height,
                                opacity: 1,
                                scale: 1,
                                zIndex: 100,
                                rotateY: initialRotateY,
                                perspective: 1000
                            }}
                            animate={{
                                left: [startX, endX],
                                top: [startY, midY, endY], // Keyframes for Arc
                                width: endRect.width, // Try to match target width? Or keep fixed?
                                height: endRect.height,
                                scale: 1, // Stay full size
                                opacity: 1,
                                rotateY: 0
                            }}
                            transition={{
                                duration: 1.0,
                                ease: "easeInOut",
                                times: [0, 1] // Corresponding to the keyframes. For 3-point top, framer handles it.
                                // Actually for 3 points top: [0, 0.5, 1] is default
                            }}
                        // Remove exit animation to prevent ghosting or fading 
                        // The real card appears exactly when this disappears (controlled by parent timeout)
                        >
                            <CardFrame cardId={card.cardId} variant="full" showCost={false} />
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};
