/**
 * LogView - Game log display
 */

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { LogEntry } from '../../shared/types/Log';
import { PublicPlayerState } from '../../shared/types/SerializedState';
import { RichLogEntry } from './RichLogEntry';
import './LogView.css';

interface LogViewProps {
    logs: LogEntry[];
    history?: any[]; // For structured history
    players: PublicPlayerState[];
    myPlayerId: string | null;
    /** Clicking a player's line offers to go back to just before it */
    canRewind?: boolean;
    onRequestRewind?: (logId: string) => void;
}

export const LogView: React.FC<LogViewProps> = ({ logs, history, players, canRewind, onRequestRewind }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
    useEffect(() => { if (!canRewind) setSelectedLogId(null); }, [canRewind]);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [logs, history]);

    // Combine logs and history, removing duplicates while preserving order
    const allEntries = useMemo(() => {
        const entries: (LogEntry & { isRewindable?: boolean; sequenceOrder?: number; _skip?: boolean; indent?: number; message?: string })[] = [];
        const seenIds = new Set<string>();

        const addEntry = (entry: LogEntry, isHistory: boolean, index: number) => {
            // De-dupe by ID if present
            if (entry.id && seenIds.has(entry.id)) return;
            if (entry.id) seenIds.add(entry.id);

            entries.push({
                ...entry,
                isRewindable: (entry as any).isRewindable ?? isHistory,
                sequenceOrder: index
            });
        };

        // Add log entries first (real-time logs)
        if (logs) {
            logs.forEach((log, i) => addEntry(log, false, i));
        }

        const logsCount = entries.length;

        // Then add history entries
        if (history) {
            history.forEach((event, i) => {
                addEntry(event as LogEntry, true, logsCount + i);
            });
        }

        // Sort by timestamp if available, else sequence
        return entries.sort((a, b) => {
            if (a.timestamp && b.timestamp) return a.timestamp - b.timestamp;
            return (a.sequenceOrder || 0) - (b.sequenceOrder || 0);
        });
    }, [logs, history]);



    return (
        <div className="log-view">
            <div className="log-view-header">
                <h3>Journal</h3>
            </div>

            <div className="log-entries" ref={containerRef}>
                    {allEntries.map((entry, i) => (
                        <React.Fragment key={entry.id || i}>
                            <RichLogEntry
                                entry={entry}
                                players={players}
                                isRewindable={!!canRewind && !!onRequestRewind && !!entry.isRewindable}
                                isSelected={selectedLogId === entry.id}
                                onSelect={() => entry.id && setSelectedLogId(prev => prev === entry.id ? null : entry.id!)}
                            />
                            {selectedLogId && selectedLogId === entry.id && (
                                <div className="log-rewind-confirm">
                                    <button
                                        className="log-rewind-go"
                                        onClick={() => { onRequestRewind?.(entry.id!); setSelectedLogId(null); }}
                                        title="Les autres joueurs devront accepter"
                                    >
                                        ⏪ Revenir avant ce coup
                                    </button>
                                    <button className="log-rewind-cancel" onClick={() => setSelectedLogId(null)}>Annuler</button>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
            </div>
        </div>
    );
};
