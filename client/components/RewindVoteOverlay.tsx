import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './RewindVoteOverlay.css';

interface RewindVoteOverlayProps {
    request: {
        requesterId: string;
        targetLogId: string;
        targetLogEntry?: { message: string };
        votes: Record<string, boolean>;
        /** Players who must agree (connected humans) */
        voterIds?: string[];
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

    const isRequester = request.requesterId === myPlayerId;
    const voters = players.filter(p => p.id !== request.requesterId && (request.voterIds ? request.voterIds.includes(p.id) : true));
    const mustVote = voters.some(p => p.id === myPlayerId);
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
                        <h3>Retour en arrière</h3>
                    </div>

                    <div className="rewind-body">
                        <p>
                            <strong style={{ color: requester?.color }}>{requester?.name}</strong> demande à revenir en arrière.
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
                                <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '4px' }}>Revenir juste avant :</div>
                                <div style={{ fontSize: '0.9rem' }}>
                                    {formatLogMessage(request.targetLogEntry.message, players)}
                                </div>
                            </div>
                        )}

                        <div className="vote-status">
                            <p>Accord nécessaire :</p>
                            <div className="vote-list">
                                {voters.map(p => (
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

                    {mustVote && !hasVoted && (
                        <div className="rewind-actions">
                            <button className="btn-reject" onClick={() => onVote(false)}>Refuser</button>
                            <button className="btn-approve" onClick={() => onVote(true)}>Accepter</button>
                        </div>
                    )}

                    {(!mustVote || hasVoted) && (
                        <div className="waiting-msg">
                            En attente de l'accord des autres joueurs…
                        </div>
                    )}

                    {isRequester && (
                        <div className="rewind-actions">
                            <button className="btn-reject" onClick={() => onVote(false)}>Annuler ma demande</button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
