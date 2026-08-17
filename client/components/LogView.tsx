/**
 * LogView - Game log display
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { LogEntry } from '../../shared/types/Log';
import { PublicPlayerState } from '../../shared/types/SerializedState';
import { RichLogEntry } from './RichLogEntry';
import './LogView.css';

interface LogViewProps {
    logs: LogEntry[];
    history?: any[]; // For structured history
    players: PublicPlayerState[];
    myPlayerId: string | null;
    rewindMode?: boolean; // Whether rewind selection mode is active
    selectedLogId?: string | null; // Currently selected log entry
    onSelectLog?: (logId: string) => void; // Callback when a log is selected
    onRequestRewind?: (logId: string) => void;
}

export const LogView: React.FC<LogViewProps> = ({ logs, history, players, rewindMode, selectedLogId, onSelectLog, onRequestRewind }) => {
    const containerRef = useRef<HTMLDivElement>(null);

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
                isRewindable: isHistory,
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
                <AnimatePresence mode="popLayout">
                    {allEntries.map((entry, i) => (
                        <RichLogEntry
                            key={entry.id || i}
                            entry={entry}
                            players={players}
                            isRewindable={rewindMode && entry.isRewindable}
                            isSelected={selectedLogId === entry.id}
                            onSelect={() => onSelectLog && entry.id && onSelectLog(entry.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};
