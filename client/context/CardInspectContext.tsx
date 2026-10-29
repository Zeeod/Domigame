import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type CardInspectContextType = CardInspectState & CardInspectActions;

interface CardInspectState {
    hoveredCardId: string | null;
    hoveredInstanceId?: string | null;
    hoveredPosition: { x: number; y: number } | null;
    zoomedCardId: string | null;
    /** The card that put the zoomed card where it is (Bane: Young Witch…), shown beside it */
    zoomedOrigin: ZoomOrigin | null;
}

export interface ZoomOrigin {
    cardId: string;
    label?: string;
}

interface CardInspectActions {
    setHovered: (cardId: string, x: number, y: number, instanceId?: string) => void;
    clearHovered: () => void;
    setZoomed: (cardId: string, origin?: ZoomOrigin) => void;
    clearZoomed: () => void;
}

const CardInspectContext = createContext<CardInspectContextType | null>(null);

export const CardInspectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
    const [hoveredInstanceId, setHoveredInstanceId] = useState<string | null>(null);
    const [hoveredPosition, setHoveredPosition] = useState<{ x: number; y: number } | null>(null);
    const [zoomedCardId, setZoomedCardId] = useState<string | null>(null);
    const [zoomedOrigin, setZoomedOrigin] = useState<ZoomOrigin | null>(null);

    const setHovered = useCallback((cardId: string, x: number, y: number, instanceId?: string) => {
        setHoveredCardId(cardId);
        setHoveredInstanceId(instanceId || null);
        setHoveredPosition({ x, y });
    }, []);

    const clearHovered = useCallback(() => {
        setHoveredCardId(null);
        setHoveredPosition(null);
    }, []);

    const setZoomed = useCallback((cardId: string, origin?: ZoomOrigin) => {
        setZoomedCardId(cardId);
        setZoomedOrigin(origin ?? null);
    }, []);

    const clearZoomed = useCallback(() => {
        setZoomedCardId(null);
        setZoomedOrigin(null);
    }, []);

    return (
        <CardInspectContext.Provider value={{
            hoveredCardId,
            hoveredInstanceId,
            hoveredPosition,
            zoomedCardId,
            zoomedOrigin,
            setHovered,
            clearHovered,
            setZoomed,
            clearZoomed
        }}>
            {children}
        </CardInspectContext.Provider>
    );
};

export const useCardInspect = (): CardInspectContextType => {
    const context = useContext(CardInspectContext);
    if (!context) {
        throw new Error('useCardInspect must be used within a CardInspectProvider');
    }
    return context;
};
