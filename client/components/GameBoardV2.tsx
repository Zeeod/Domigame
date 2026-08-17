/**
 * GameBoardV2 - Main game board component (passive client)
 * 
 * NEVER computes rules
 * NEVER infers legality
 * ONLY renders server state
 */

import React, { useMemo } from 'react';
import { GameState } from '../hooks/useSocket';
import { HandView } from './HandView';
import { SupplyView } from './SupplyView';
import { PlayerBoardView } from './PlayerBoardView';
import { LogView } from './LogView';
import { ActionBar as TurnIndicator } from './ActionBar';
import { VictoryScreen } from './VictoryScreen';
import { ChoiceModalV2 as ChoiceModal } from './ChoiceModalV2';
import { TurnNotification } from './TurnNotification'; // Added
import './GameBoardV2.css';

interface GameBoardV2Props {
    gameState: GameState;
    playerId: string | null;
    onPlayCard: (cardInstanceId: string) => void;
    onBuyCard: (cardId: string) => void;
    onEndPhase: () => void;
    onChoose: (choiceId: string, payload: any) => void;
    onPlayAgain?: () => void; // Added prompt
    onReturnToLobby?: () => void; // Added prompt
    onPayDebt?: (amount: number) => void;
}

export const GameBoardV2: React.FC<GameBoardV2Props> = ({
    gameState,
    playerId,
    onPlayCard,
    onBuyCard,
    onEndPhase,
    onChoose,
    onPlayAgain,
    onReturnToLobby,
    onPayDebt
}) => {
    const { public: pub, private: priv } = gameState;

    const currentPlayer = pub.players[pub.currentPlayerIndex];
    const isMyTurn = currentPlayer?.id === playerId;
    const myPlayer = pub.players.find(p => p.id === playerId);

    const pendingDecision = pub.pendingDecision;
    const isMyChoice = pendingDecision?.playerId === playerId;

    // Supply organized by type
    const supplyByType = useMemo(() => {
        const treasures: string[] = [];
        const victories: string[] = [];
        const actions: string[] = [];

        for (const cardId of Object.keys(pub.supply)) {
            if (['copper', 'silver', 'gold'].includes(cardId)) {
                treasures.push(cardId);
            } else if (['estate', 'duchy', 'province'].includes(cardId)) {
                victories.push(cardId);
            } else {
                actions.push(cardId);
            }
        }

        return { treasures, victories, actions };
    }, [pub.supply]);

    const isSpectator = !myPlayer && !!playerId;

    return (
        <div className={`game-board ${isMyTurn ? 'my-turn' : ''} ${isSpectator ? 'spectator-mode' : ''}`}>
            {/* Spectator Banner */}
            {isSpectator && (
                <div className="spectator-banner">
                    MODE SPECTATEUR - Vous observez la partie en cours
                    <button className="join-next-btn" onClick={() => window.location.reload()}>
                        Rejoindre la prochaine
                    </button>
                </div>
            )}

            {/* Turn Notification Overlay */}
            <TurnNotification isMyTurn={isMyTurn} />

            {/* Top Bar: Turn Indicator */}
            <TurnIndicator
                phase={pub.phase}
                turnNumber={pub.turnNumber}
                currentPlayerName={currentPlayer?.name ?? ''}
                currentPlayerColor={currentPlayer?.color ?? '#fff'}
                isMyTurn={isMyTurn}
                actions={myPlayer?.actions ?? 0}
                buys={myPlayer?.buys ?? 0}
                coins={myPlayer?.coins ?? 0}
                tokens={myPlayer?.tokens ?? {}}
                instruction=""
                hasPendingDecision={false}
                isValid={true}
                canPass={false}
                onEndPhase={onEndPhase}
                onPlayTreasures={() => {
                    const treasures = priv?.hand.filter(c => ['copper', 'silver', 'gold'].includes(c.id)) || [];
                    treasures.forEach(t => onPlayCard(t.instanceId));
                }}
                onPayDebt={onPayDebt}
            />

            {/* Main Layout */}
            <div className="game-layout">
                {/* Left: Other Players */}
                <div className="other-players">
                    {pub.players
                        .filter(p => p.id !== playerId)
                        .map(player => (
                            <PlayerBoardView
                                key={player.id}
                                player={player}
                                isCurrent={player.id === currentPlayer?.id}
                            />
                        ))
                    }
                </div>

                {/* Center: Supply */}
                <div className="supply-area">
                    <SupplyView
                        supply={pub.supply}
                        supplyByType={supplyByType}
                        canBuy={isMyTurn && pub.phase === 'BUY' && (myPlayer?.buys ?? 0) > 0}
                        coins={myPlayer?.coins ?? 0}
                        onBuy={onBuyCard}
                    />
                </div>

                {/* Right: Log */}
                <div className="log-area">
                    <LogView logs={pub.logs} players={pub.players} myPlayerId={playerId} />
                </div>
            </div>

            {/* Bottom: My Hand (Hidden for Spectators) */}
            {!isSpectator && (
                <div className="my-area">
                    <HandView
                        hand={priv?.hand ?? []}
                        playArea={myPlayer?.playArea ?? []}
                        canPlay={isMyTurn && (pub.phase === 'ACTION' || pub.phase === 'BUY')}
                        actions={myPlayer?.actions ?? 0}
                        phase={pub.phase}
                        landscapes={pub.landscapes || []}
                        onPlayCard={onPlayCard}
                    />

                    {/* Action Buttons MOVED TO TOP BAR */}
                    {isMyTurn && !pendingDecision && (
                        <div className="action-buttons-placeholder" style={{ display: 'none' }} />
                    )}
                </div>
            )}

            {/* Choice Modal */}
            {pub.pendingDecision && isMyChoice && (
                <ChoiceModal
                    choice={pub.pendingDecision as any}
                    hand={priv?.hand ?? []}
                    discard={myPlayer?.discardPile ?? []}
                    revealed={pub.revealedCards?.cards ?? []}
                    supply={pub.supply}
                    onChoose={onChoose}
                />
            )}

            {/* Waiting overlay for other player's choice */}
            {pub.pendingDecision && !isMyChoice && (
                <div className="waiting-overlay">
                    <div className="waiting-message">
                        En attente de {pub.players.find(p => p.id === pub.pendingDecision!.playerId)?.name}...
                    </div>
                </div>
            )}

            {/* Victory Screen */}
            {pub.isGameOver && pub.gameResults && (
                <VictoryScreen
                    scores={pub.gameResults}
                    winnerId={pub.winnerId}
                    onPlayAgain={onPlayAgain || (() => window.location.reload())}
                    onReturnToLobby={onReturnToLobby || (() => window.location.reload())}
                />
            )}
        </div>
    );
};
