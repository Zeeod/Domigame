import React, { useLayoutEffect, useRef, useState } from 'react';
import './FitToBox.css';

interface FitToBoxProps {
    children: React.ReactNode;
    /** Never enlarge beyond this (1 = natural size at most) */
    maxScale?: number;
    className?: string;
}

/**
 * Shows its content at its natural size, scaled down just enough to fit the space it is given
 * (width and height), whatever the number of piles or landscapes. Follows window and content resizes.
 */
export const FitToBox: React.FC<FitToBoxProps> = ({ children, maxScale = 1, className }) => {
    const outerRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useLayoutEffect(() => {
        const outer = outerRef.current, inner = innerRef.current;
        if (!outer || !inner) return;
        const update = () => {
            // Natural size of the content (offsetWidth/Height ignore the transform)
            const w = inner.offsetWidth, h = inner.offsetHeight;
            const availW = outer.clientWidth, availH = outer.clientHeight;
            if (!w || !h || !availW || !availH) return;
            const next = Math.min(maxScale, availW / w, availH / h);
            setScale(prev => (Math.abs(prev - next) > 0.005 ? next : prev));
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(outer);
        ro.observe(inner);
        return () => ro.disconnect();
    }, [maxScale]);

    return (
        <div ref={outerRef} className={`fit-to-box ${className ?? ''}`}>
            <div ref={innerRef} className="fit-to-box-content" style={{ transform: `scale(${scale})` }}>
                {children}
            </div>
        </div>
    );
};
