import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';

/** The board is scaled as a whole (--layout-scale): mouse moves are converted to board pixels */
const boardScale = () => !document.querySelector('.board-layout') ? 1 : parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--layout-scale')) || 1;
import './DraggableWindow.css';

interface DraggableWindowProps {
    title: string;
    initialX?: number;
    initialY?: number;
    initialWidth?: number;
    initialHeight?: number;
    onClose: () => void;
    showCloseButton?: boolean;
    children: React.ReactNode;
}

export const DraggableWindow: React.FC<DraggableWindowProps> = ({
    title,
    initialX = 100,
    initialY = 100,
    initialWidth = 400,
    initialHeight = 300,
    onClose,
    showCloseButton = true,
    children
}) => {
    const [position, setPosition] = useState({ x: initialX, y: initialY });
    const [size, setSize] = useState({ width: initialWidth, height: initialHeight });

    // Fit and center the window in the space it lives in (the scaled board), whatever the screen size
    const windowRef = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        // position: fixed inside the scaled board: the board (unscaled size) is the reference, else the screen
        const board = windowRef.current?.closest('.board-layout') as HTMLElement | null;
        const W = board?.clientWidth || window.innerWidth, H = board?.clientHeight || window.innerHeight;
        const width = Math.min(initialWidth, W - 16), height = Math.min(initialHeight, H - 16);
        setSize({ width, height });
        setPosition({ x: Math.max(8, (W - width) / 2), y: Math.min(Math.max(8, initialY), Math.max(8, H - height - 8)) });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Dragging state
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const windowStart = useRef({ x: 0, y: 0 });

    // Resizing state
    const isResizing = useRef(false);
    const resizeStart = useRef({ x: 0, y: 0 });
    const sizeStart = useRef({ w: 0, h: 0 });

    const handleMouseDownHeader = (e: React.MouseEvent) => {
        // Only trigger drag if left button and target is self or title
        if (e.button !== 0) return;

        isDragging.current = true;
        dragStart.current = { x: e.clientX, y: e.clientY };
        windowStart.current = { ...position };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseDownResize = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        e.stopPropagation(); // Prevent drag

        isResizing.current = true;
        resizeStart.current = { x: e.clientX, y: e.clientY };
        sizeStart.current = { w: size.width, h: size.height };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging.current) {
            const k = boardScale();
            const dx = (e.clientX - dragStart.current.x) / k;
            const dy = (e.clientY - dragStart.current.y) / k;

            setPosition({
                x: windowStart.current.x + dx,
                y: windowStart.current.y + dy
            });
        }

        if (isResizing.current) {
            const k = boardScale();
            const dx = (e.clientX - resizeStart.current.x) / k;
            const dy = (e.clientY - resizeStart.current.y) / k;

            setSize({
                width: Math.max(200, sizeStart.current.w + dx),
                height: Math.max(150, sizeStart.current.h + dy)
            });
        }
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        isResizing.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    // Cleanup on unmount (safety)
    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    return (
        <div
            ref={windowRef}
            className="draggable-window"
            style={{
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height
            }}
        >
            <div className="window-header" onMouseDown={handleMouseDownHeader}>
                <div className="window-title">{title}</div>
                {showCloseButton && (
                    <div className="window-controls">
                        <button className="window-close-btn" onClick={onClose}>×</button>
                    </div>
                )}
            </div>
            <div className="window-content">
                {children}
            </div>
            <div className="window-resize-handle" onMouseDown={handleMouseDownResize} />
        </div>
    );
};
