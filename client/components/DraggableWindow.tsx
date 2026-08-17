import React, { useState, useRef, useEffect } from 'react';
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
            const dx = e.clientX - dragStart.current.x;
            const dy = e.clientY - dragStart.current.y;

            setPosition({
                x: windowStart.current.x + dx,
                y: windowStart.current.y + dy
            });
        }

        if (isResizing.current) {
            const dx = e.clientX - resizeStart.current.x;
            const dy = e.clientY - resizeStart.current.y;

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
