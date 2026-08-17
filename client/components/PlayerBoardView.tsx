/**
 * PlayerBoardView - Other player's board display
 */

import React from 'react';
import './PlayerBoardView.css';

interface PublicPlayer {
    id: string;
    name: string;
    color: string;
    handCount: number;
    deckCount: number;
    discardCount: number;
    playArea: { id: string; name: string }[];
    actions: number;
    buys: number;
    coins: number;
    tokens?: Record<string, number>;
    mats?: Record<string, any[]>;
}

interface PlayerBoardViewProps {
    player: PublicPlayer;
    isCurrent: boolean;
}

export const PlayerBoardView: React.FC<PlayerBoardViewProps> = ({ player, isCurrent }) => {
    return (
        <div
            className={`player-board ${isCurrent ? 'is-current' : ''}`}
            style={{ borderLeftColor: player.color }}
        >
            <div className="player-header">
                <span className="player-name">{player.name}</span>
                {isCurrent && <span className="current-badge">⚔️</span>}
            </div>

            <div className="player-zones">
                <div className="zone">
                    <span className="zone-icon">🃏</span>
                    <span className="zone-count">{player.handCount}</span>
                </div>
                <div className="zone">
                    <span className="zone-icon">📚</span>
                    <span className="zone-count">{player.deckCount}</span>
                </div>
                <div className="zone">
                    <span className="zone-icon">🗑️</span>
                    <span className="zone-count">{player.discardCount}</span>
                </div>
            </div>

            {isCurrent && (
                <div className="player-resources">
                    <span>{player.actions}A</span>
                    <span>{player.buys}B</span>
                    <span>{player.coins}💰</span>
                </div>
            )}

            {/* Tokens */}
            {player.tokens && Object.keys(player.tokens).length > 0 && (
                <div className="player-tokens">
                    {Object.entries(player.tokens).map(([key, val]) => (
                        val > 0 && (
                            <div key={key} className="mini-token" title={key}>
                                {key.charAt(0).toUpperCase()}: {val}
                            </div>
                        )
                    ))}
                </div>
            )}

            {/* Mats */}
            {player.mats && Object.keys(player.mats).length > 0 && (
                <div className="player-mats">
                    {Object.entries(player.mats).map(([key, cards]) => (
                        cards.length > 0 && (
                            <div key={key} className="mini-mat" title={`${key}: ${cards.length} cards`}>
                                {key}: {cards.length}
                            </div>
                        )
                    ))}
                </div>
            )}

            {player.playArea.length > 0 && (
                <div className="player-play-area">
                    {player.playArea.map((card, i) => (
                        <span key={i} className="played-card">{card.name}</span>
                    ))}
                </div>
            )}
        </div>
    );
};
