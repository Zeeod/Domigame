import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HistoricalPersona } from '../../shared/data/historicalPersonas';

interface PersonaTooltipProps {
    persona: HistoricalPersona;
    children: React.ReactNode;
}

export const PersonaTooltip: React.FC<PersonaTooltipProps> = ({ persona, children }) => {
    const [isHovered, setIsHovered] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const handleMouseEnter = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.top,
                left: rect.right + 15 // Gap from the element
            });
        }
        setIsHovered(true);
    };

    return (
        <>
            <div
                ref={triggerRef}
                className="inline-flex items-center"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={() => setIsHovered(false)}
            >
                {children}
            </div>

            {ReactDOM.createPortal(
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            initial={{ opacity: 0, x: -10, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="fixed z-[9999] w-[280px]"
                            style={{
                                top: position.top,
                                left: position.left,
                                pointerEvents: 'none'
                            }}
                        >
                            <div className="
                                backdrop-blur-md bg-black/80 border border-white/20 
                                rounded-xl p-4 shadow-2xl text-left
                                relative overflow-hidden
                            ">
                                {/* Decorative accent line */}
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-amber-600 opacity-80" />

                                <div className="pl-3">
                                    {/* Name: Bold, accented color */}
                                    <h3 className="text-amber-400 font-bold text-lg leading-tight mb-1">
                                        {persona.name}
                                    </h3>

                                    {/* Years: Below name, specific color */}
                                    <div className="text-amber-200/60 text-xs font-sans mb-3 font-medium">
                                        {persona.years}
                                    </div>

                                    {/* Description: Standard font, readable, not bold */}
                                    <p className="text-gray-100 text-sm leading-relaxed text-left font-sans font-normal antialiased">
                                        {persona.description}
                                    </p>
                                </div>

                                {/* Subtle background shine/glow */}
                                <div className="absolute -top-10 -right-10 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};
