import React, { useEffect, useState } from 'react';
import './TurnNotification.css';

interface TurnNotificationProps {
    isMyTurn: boolean;
}

export const TurnNotification: React.FC<TurnNotificationProps> = ({ isMyTurn }) => {
    const [show, setShow] = useState(false);
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        if (isMyTurn) {
            setShow(true);
            setAnimating(true);

            // Hide after animation duration
            const timer = setTimeout(() => {
                setAnimating(false);
                setTimeout(() => setShow(false), 500); // Wait for fade out
            }, 2000);

            return () => clearTimeout(timer);
        } else {
            setShow(false);
            setAnimating(false);
        }
    }, [isMyTurn]);

    if (!show) return null;

    return (
        <div className={`turn-notification ${animating ? 'enter' : 'exit'}`}>
            <div className="notification-content">
                <div className="notification-icon">⚔️</div>
                <div className="notification-text">À VOUS DE JOUER !</div>
                <div className="notification-sub">C'est votre tour</div>
            </div>
        </div>
    );
};
