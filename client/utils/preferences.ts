/**
 * Player options, kept in this browser (localStorage). Components read them with usePreference and
 * are re-rendered when they change.
 */
import { useEffect, useState } from 'react';
import { safeStorage } from './safeStorage';

export interface Preferences {
    /** Ask for a second click before ending a phase with Actions or coins left */
    confirmEndPhase: boolean;
    /** Let the server answer decisions that have only one possible answer */
    autoForcedChoices: boolean;
}

const DEFAULTS: Preferences = {
    confirmEndPhase: true,
    autoForcedChoices: true,
};

const KEY = 'dominion_preferences';
const listeners = new Set<() => void>();

export function getPreferences(): Preferences {
    try {
        return { ...DEFAULTS, ...JSON.parse(safeStorage.get(KEY) || '{}') };
    } catch {
        return { ...DEFAULTS };
    }
}

export function setPreference<K extends keyof Preferences>(key: K, value: Preferences[K]): void {
    safeStorage.set(KEY, JSON.stringify({ ...getPreferences(), [key]: value }));
    listeners.forEach(l => l());
}

export function onPreferencesChange(listener: () => void): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
}

export function usePreference<K extends keyof Preferences>(key: K): Preferences[K] {
    const [value, setValue] = useState(() => getPreferences()[key]);
    useEffect(() => onPreferencesChange(() => setValue(getPreferences()[key])), [key]);
    return value;
}
