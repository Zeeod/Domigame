import React from 'react';
import { motion, Variants } from 'framer-motion';
import { CardFrame, CardFrameProps } from './CardFrame';
import { useSound } from '../hooks/useSound';

interface AnimatedCardProps extends CardFrameProps {
    instanceId?: string; // Unique ID for shared layout animations
    index?: number; // For staggered animations
    layoutId?: string; // Explicit layoutId override
    className?: string; // Additional classes
    style?: React.CSSProperties; // Additional styles
    liftOnSelect?: boolean;
    disableLayout?: boolean; // NEW: To prevent conflict with Reorder.Item
    selectionMode?: boolean; // NEW: For subtle highlighting in selection contexts
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
    instanceId,
    index = 0,
    layoutId,
    className,
    style,
    children,
    liftOnSelect = true, // Default to true (Hand behavior)
    disableLayout = false,
    selectionMode = false,
    ...cardFrameProps
}) => {
    const { playSound } = useSound();
    // Dynamic variants to support optional lifting
    const dynamicVariants: Variants = {
        initial: { opacity: 0, y: 20, scale: 0.9 },
        animate: (i: number = 0) => ({
            opacity: 1, y: 0, scale: 1,
            transition: { delay: i * 0.05, type: "spring", stiffness: 300, damping: 25 }
        }),
        selected: {
            opacity: 1, // Ensure visibility
            y: liftOnSelect ? -30 : 0, // Conditional lifting
            scale: 1.05,
            zIndex: 20,
            transition: { type: "spring", stiffness: 400, damping: 20 }
        },
        exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } },
        hover: { scale: 1.1, zIndex: 10, transition: { duration: 0.2 } },
        tap: { scale: 0.95 }
    };

    // Use instanceId as default layoutId if provided, UNLESS disabled
    const finalLayoutId = disableLayout ? undefined : (layoutId || (instanceId ? `card-${instanceId}` : undefined));

    // Determine animation state
    const isSelected = cardFrameProps.selected;
    const animationState = isSelected ? "selected" : "animate";

    return (
        <motion.div
            layoutId={finalLayoutId}
            custom={index}
            variants={dynamicVariants}
            initial="initial"
            animate={animationState} // Use dynamic state
            exit="exit"
            onMouseEnter={() => !cardFrameProps.disabled && !cardFrameProps.dimmed && playSound('hover', 0.05)}
            whileHover={!cardFrameProps.disabled && !isSelected && !cardFrameProps.dimmed ? "hover" : undefined}
            whileTap={!cardFrameProps.disabled && !cardFrameProps.dimmed ? "tap" : undefined}
            className={`${className} ${cardFrameProps.dimmed ? 'card-dimmed' : ''}`}
            style={{
                position: 'relative',
                display: 'inline-block',
                cursor: (cardFrameProps.playable || isSelected) && !cardFrameProps.dimmed ? 'pointer' : 'default',
                ...style
            }}
        >
            <CardFrame {...cardFrameProps} instanceId={instanceId} />

            {/* Selection Stack Count Overlay (for Hand stacking only) */}
            {children}

            {/* Selection Glow (Blue/Gold Halo) for Selected Items */}
            {isSelected && (
                <motion.div
                    layoutId={`glow-${finalLayoutId}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'absolute',
                        inset: -6,
                        borderRadius: 12,
                        boxShadow: cardFrameProps.selectionVariant === 'red'
                            ? '0 0 20px 4px rgba(231, 76, 60, 0.7)' // Vibrant red for trash
                            : cardFrameProps.selectionVariant === 'blue'
                                ? '0 0 25px 6px rgba(52, 152, 219, 0.7)' // Strong blue for beneficial
                                : '0 0 20px 4px rgba(255, 215, 0, 0.6)', // Gold for others
                        zIndex: -1,
                        pointerEvents: 'none'
                    }}
                />
            )}

            {/* Selection Mode Hint (Subtle highlight instead of blinking red) */}
            {!isSelected && selectionMode && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.15 }}
                    style={{
                        position: 'absolute',
                        inset: -2,
                        borderRadius: 10,
                        backgroundColor: '#3498db',
                        zIndex: 1,
                        pointerEvents: 'none'
                    }}
                />
            )}
        </motion.div>
    );
};
