import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './RewindVoteOverlay.css';

interface RewindVoteOverlayProps {
    request: {
        requesterId: string;
        targetLogId: string;
        targetLogEntry?: { message: string; activePlayerId: string }; // Optional for now
        votes: Record<string, boolean>;
    };
    players: { id: string; name: string; color: string }[];
    myPlayerId: string;
    onVote: (approved: boolean) => void;
}


export const RewindVoteOverlay: React.FC<RewindVoteOverlayProps> = ({
    request,
    players,
    myPlayerId,
    onVote
}) => {
    const requester = players.find(p => p.id === request.requesterId);

    // Check if I already voted
    const hasVoted = request.votes[myPlayerId] !== undefined;

    // Format log message with colored player names
    const formatLogMessage = (message: string, playersList: typeof players) => {
        const parts: React.ReactNode[] = [];
        let remaining = message;

        // Sort players by name length (descending) to avoid partial matches
        const sortedPlayers = [...playersList].sort((a, b) => b.name.length - a.name.length);

        while (remaining.length > 0) {
            let found = false;
            let earliestIndex = -1;
            let matchedPlayer: typeof players[0] | null = null;

            for (const player of sortedPlayers) {
                const index = remaining.indexOf(player.name);
                if (index !== -1 && (earliestIndex === -1 || index < earliestIndex)) {
                    earliestIndex = index;
                    matchedPlayer = player;
                    found = true;
                }
            }

            if (found && matchedPlayer) {
                if (earliestIndex > 0) {
                    parts.push(remaining.substring(0, earliestIndex));
                }
                parts.push(
                    <span
                        key={`${matchedPlayer.id}-${parts.length}`}
                        style={{ color: matchedPlayer.color, fontWeight: 600 }}
                    >
                        {matchedPlayer.name}
                    </span>
                );
                remaining = remaining.substring(earliestIndex + matchedPlayer.name.length);
            } else {
                parts.push(remaining);
                break;
            }
        }

        return parts;
    };

    return (
        <AnimatePresence>
            <motion.div
                className="rewind-vote-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="rewind-vote-panel"
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                >
                    <div className="rewind-header">
                        <span className="rewind-icon">⏪</span>
                        <h3>Demande de Rembobinage</h3>
                    </div>

                    <div className="rewind-body">
                        <p>
                            <strong style={{ color: requester?.color }}>{requester?.name}</strong> souhaite revenir en arrière dans la partie.
                        </p>

                        {/* Display selected log entry if available */}
                        {request.targetLogEntry && (
                            <div className="target-log-entry" style={{
                                background: 'rgba(139, 195, 74, 0.15)',
                                border: '2px solid #8bc34a',
                                borderRadius: '4px',
                                padding: '8px 12px',
                                marginTop: '12px',
                                marginBottom: '12px'
                            }}>
                                <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '4px' }}>Point de retour :</div>
                                <div style={{ fontSize: '0.9rem' }}>
                                    {formatLogMessage(request.targetLogEntry.message, players)}
                                </div>
                            </div>
                        )}

                        <div className="vote-status">
                            <p>Votes requis :</p>
                            <div className="vote-list">
                                {players.filter(p => p.id !== request.requesterId).map(p => (
                                    <div key={p.id} className="vote-item">
                                        <span className="voter-name" style={{ color: p.color }}>{p.name}</span>
                                        <span className={`vote-badge ${request.votes[p.id] === true ? 'approved' : (request.votes[p.id] === false ? 'rejected' : 'pending')}`}>
                                            {request.votes[p.id] === true ? 'OUI' : (request.votes[p.id] === false ? 'NON' : '...')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {!hasVoted && (
                        <div className="rewind-actions">
                            <button className="btn-reject" onClick={() => onVote(false)}>Refuser</button>
                            <button className="btn-approve" onClick={() => onVote(true)}>Accepter</button>
                        </div>
                    )}

                    {hasVoted && (
                        <div className="waiting-msg">
                            Attente des autres joueurs...
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
